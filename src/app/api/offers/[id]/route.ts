import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { updateOrderChannelPost } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";

const schema = z.object({ action: z.enum(["ACCEPT", "REJECT"]) });

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

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri amal" }, { status: 400 });
  }

  const offer = await db.offer.findUnique({
    where: { id },
    include: { order: true },
  });
  if (!offer) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (offer.order.ordererId !== session.user.id) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  if (parsed.data.action === "REJECT") {
    const rejected = await db.offer.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    await logActivity(
      session.user.id,
      "OFFER_REJECT",
      `Taklifni rad etdi: «${offer.order.title}»`,
      { orderId: offer.orderId, offerId: id },
    );
    return NextResponse.json({ offer: rejected });
  }

  // ACCEPT: buyurtmani tayyorlovchiga biriktiramiz, boshqa takliflarni rad etamiz,
  // tayyorlovchini "band" qilamiz
  const result = await db.$transaction(async (tx) => {
    if (offer.order.status !== "OPEN") {
      throw new Error("Buyurtma allaqachon band");
    }
    const acceptedOffer = await tx.offer.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });
    await tx.offer.updateMany({
      where: { orderId: offer.orderId, NOT: { id } },
      data: { status: "REJECTED" },
    });
    await tx.order.update({
      where: { id: offer.orderId },
      data: { status: "IN_PROGRESS", preparerId: offer.preparerId },
    });
    await tx.user.update({
      where: { id: offer.preparerId },
      data: { isAvailable: false },
    });
    return acceptedOffer;
  });

  await updateOrderChannelPost(offer.orderId);

  await logActivity(
    session.user.id,
    "OFFER_ACCEPT",
    `Taklifni qabul qildi: «${offer.order.title}» — ${offer.price.toLocaleString("ru-RU")} so'm`,
    { orderId: offer.orderId, offerId: id, price: offer.price },
  );

  return NextResponse.json({ offer: result });
}
