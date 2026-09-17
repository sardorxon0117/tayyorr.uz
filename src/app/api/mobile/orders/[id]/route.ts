import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import { getRestriction, restrictionText } from "@/lib/restriction";
import { updateOrderChannelPost, markOrderRemovedInChannel } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";
import { refundOfferStars } from "@/lib/stars";
import { logToGroup, siteUrl } from "@/lib/telegram-log";
import { softDeleteOrder } from "@/lib/order-delete";
import { maskName } from "@/lib/mask-name";

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
        // navbat: ko'proq star sarflagan yuqorida, teng bo'lsa birinchi
        // yuborgan yuqorida — web bilan bir xil.
        orderBy: [{ starsSpent: "desc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!order) return mobileJson({ error: "Topilmadi" }, { status: 404 });

  const isOrderer = order.ordererId === auth.userId;
  const isParty = isOrderer || order.preparerId === auth.userId;
  const hasOffered = order.offers.some((o) => o.preparerId === auth.userId);
  if (!isParty && !hasOffered && (order.status !== "OPEN" || order.deletedAt)) {
    return mobileJson({ error: "Topilmadi" }, { status: 404 });
  }

  const offers = isOrderer ? order.offers : order.offers.filter((o) => o.preparerId === auth.userId);

  // navbat: boshqa tayyorlovchilarga o'rin/star ko'rinadi, lekin ism
  // serverda qisman yashiriladi (haqiqiy ism mijozga umuman yuborilmaydi)
  let queue: Array<{
    position: number;
    mine: boolean;
    starsSpent: number;
    visible: string;
    hiddenLen: number;
  }> = [];
  if (!isOrderer) {
    const me = await db.user.findUnique({ where: { id: auth.userId }, select: { role: true } });
    if (me?.role === "PREPARER") {
      queue = order.offers.map((o, i) => {
        const mine = o.preparerId === auth.userId;
        const displayName = o.preparer.name ?? o.preparer.login ?? "Tayyorlovchi";
        const masked = mine ? { visible: displayName, hiddenLen: 0 } : maskName(displayName, 0.2);
        return { position: i + 1, mine, starsSpent: o.starsSpent, ...masked };
      });
    }
  }

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
      queue,
      offers: offers.map((o) => ({
        id: o.id,
        price: o.price,
        message: o.message,
        status: o.status,
        starsSpent: o.starsSpent,
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

/** Buyurtmachi o'z buyurtmasini o'chiradi (soft) — web bilan bir xil mantiq. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    select: { ordererId: true, deletedAt: true },
  });
  if (!order || order.ordererId !== auth.userId) {
    return mobileJson({ error: "Topilmadi" }, { status: 404 });
  }
  if (order.deletedAt) {
    return mobileJson({ error: "Allaqachon o'chirilgan" }, { status: 400 });
  }

  const full = await softDeleteOrder(id, "ORDERER", null);
  if (full?.telegramMessageId) {
    await markOrderRemovedInChannel(full.telegramMessageId, full.title, "Buyurtmachi", null);
  }

  await logActivity(auth.userId, "ORDER_DELETE", `Buyurtmani o'chirdi${full?.title ? `: «${full.title}»` : ""} (mobil ilova)`, {
    orderId: id,
  });

  return mobileJson({ ok: true });
}
