import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import { getRestriction, restrictionText } from "@/lib/restriction";
import { updateOrderChannelPost } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";
import { refundOfferStars } from "@/lib/stars";
import { logToGroup, siteUrl } from "@/lib/telegram-log";

export { OPTIONS } from "@/lib/mobile-cors";

/** Buyurtma tafsilotlari — takliflar bilan birga (web bilan bir xil mantiq). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      orderer: { select: { id: true, name: true, login: true, avatarUrl: true, image: true } },
      preparer: { select: { id: true, name: true, login: true, avatarUrl: true, image: true } },
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
    },
  });
  if (!order) return mobileJson({ error: "Topilmadi" }, { status: 404 });

  const isParty = order.ordererId === auth.userId || order.preparerId === auth.userId;
  if (!isParty && (order.status !== "OPEN" || order.deletedAt)) {
    return mobileJson({ error: "Topilmadi" }, { status: 404 });
  }

  const offers =
    order.ordererId === auth.userId
      ? order.offers
      : order.offers.filter((o) => o.preparerId === auth.userId);

  return mobileJson({
    order: {
      id: order.id,
      title: order.title,
      description: order.description,
      type: order.type,
      status: order.status,
      budget: order.budget,
      deadline: order.deadline?.toISOString() ?? null,
      deletedAt: order.deletedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      orderer: order.orderer,
      preparer: order.preparer,
      offers: offers.map((o) => ({
        id: o.id,
        price: o.price,
        message: o.message,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        preparer: {
          id: o.preparer.id,
          name: o.preparer.name,
          login: o.preparer.login,
          image: o.preparer.avatarUrl ?? o.preparer.image,
          isAvailable: o.preparer.isAvailable,
          rating: o.preparer.ratingCount ? o.preparer.ratingSum / o.preparer.ratingCount : null,
          ratingCount: o.preparer.ratingCount,
        },
      })),
    },
  });
}

const patchSchema = z.object({ status: z.enum(["DELIVERED", "DONE", "CANCELLED"]) });

/** Holatni o'zgartirish: tayyorlovchi topshiradi, buyurtmachi yakunlaydi/bekor qiladi. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const restriction = await getRestriction(auth.userId);
  if (restriction) {
    return mobileJson({ error: restrictionText(restriction) }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Noto'g'ri status" }, { status: 400 });

  const order = await db.order.findUnique({ where: { id } });
  if (!order) return mobileJson({ error: "Topilmadi" }, { status: 404 });

  const { status } = parsed.data;
  const isOrderer = order.ordererId === auth.userId;
  const isPreparer = order.preparerId === auth.userId;

  if (status === "DELIVERED" && !isPreparer) {
    return mobileJson({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  if ((status === "DONE" || status === "CANCELLED") && !isOrderer) {
    return mobileJson({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  await db.$transaction(async (tx) => {
    const o = await tx.order.update({ where: { id }, data: { status } });
    if (status === "DONE" && o.preparerId) {
      await tx.user.update({ where: { id: o.preparerId }, data: { isAvailable: true } });
    }
  });

  await updateOrderChannelPost(id);

  if (status === "CANCELLED") {
    await refundOfferStars(id, "Buyurtma bekor qilindi (mobil ilova)");
  }

  await logActivity(
    auth.userId,
    status === "DELIVERED" ? "ORDER_DELIVER" : status === "DONE" ? "ORDER_FINALIZE" : "ORDER_CANCEL",
    `Buyurtma holati: ${status} — «${order.title}» (mobil ilova)`,
    { orderId: id },
  );
  await logToGroup(
    "orders",
    status === "DELIVERED" ? "📦 Ish topshirildi" : status === "DONE" ? "✅ Buyurtma yakunlandi" : "🚫 Buyurtma bekor qilindi",
    [`«${order.title}»`],
    siteUrl(`/sardorxon/admin/orders/${id}`),
  );

  return mobileJson({ ok: true });
}
