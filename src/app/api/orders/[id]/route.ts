import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PRIVATE_BUCKET, presignGet } from "@/lib/r2";
import { restrictionApiError } from "@/lib/restriction";
import { updateOrderChannelPost } from "@/lib/telegram";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      orderer: {
        select: { id: true, name: true, login: true, avatarUrl: true, image: true },
      },
      preparer: {
        select: { id: true, name: true, login: true, avatarUrl: true, image: true },
      },
      offers: {
        include: {
          preparer: {
            select: {
              id: true,
              name: true,
              login: true,
              avatarUrl: true,
              image: true,
              isAvailable: true,
              ratingCount: true,
              ratingSum: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      files: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const isParty =
    order.ordererId === session.user.id || order.preparerId === session.user.id;

  // yopiq fayllarni faqat ishtirokchilarga vaqtinchalik link bilan beramiz
  const files = await Promise.all(
    order.files.map(async (f) => ({
      id: f.id,
      kind: f.kind,
      mimeType: f.mimeType,
      size: f.size,
      url:
        isParty && f.bucket === "private"
          ? await presignGet({ bucket: PRIVATE_BUCKET, key: f.key })
          : null,
    })),
  );

  // buyurtma beruvchi bo'lmagan tayyorlovchi boshqa takliflarni ko'rmasin
  const offers =
    order.ordererId === session.user.id
      ? order.offers
      : order.offers.filter((o) => o.preparerId === session.user.id);

  return NextResponse.json({ order: { ...order, offers, files } });
}

const patchSchema = z.object({
  status: z.enum(["DELIVERED", "DONE", "CANCELLED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const restricted = await restrictionApiError(session.user.id);
  if (restricted) return restricted;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri status" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const { status } = parsed.data;
  const isOrderer = order.ordererId === session.user.id;
  const isPreparer = order.preparerId === session.user.id;

  if (status === "DELIVERED" && !isPreparer) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  if ((status === "DONE" || status === "CANCELLED") && !isOrderer) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const updated = await db.$transaction(async (tx) => {
    const o = await tx.order.update({ where: { id }, data: { status } });
    // ish yakunlandi -> tayyorlovchi yana bo'sh
    if (status === "DONE" && o.preparerId) {
      await tx.user.update({
        where: { id: o.preparerId },
        data: { isAvailable: true },
      });
    }
    return o;
  });

  await updateOrderChannelPost(id);

  return NextResponse.json({ order: updated });
}
