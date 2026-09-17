import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import { getRestriction, restrictionText } from "@/lib/restriction";
import { logActivity } from "@/lib/activity";
import { sendTelegramToUser } from "@/lib/telegram-notify";
import { logToGroup, siteUrl, userLabel } from "@/lib/telegram-log";
import { useStars, MIN_OFFER_STARS } from "@/lib/stars";

export { OPTIONS } from "@/lib/mobile-cors";

const schema = z.object({
  price: z.number().int().positive(),
  message: z.string().max(1000).optional(),
});

/** Taklif yuborish — mobil v1: doim minimal star (MIN_OFFER_STARS) sarflanadi. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const me = await db.user.findUnique({ where: { id: auth.userId }, select: { role: true } });
  if (!me) return mobileJson({ error: "Topilmadi" }, { status: 404 });
  if (me.role !== "PREPARER") {
    return mobileJson({ error: "Faqat tayyorlovchilar taklif yubora oladi" }, { status: 403 });
  }

  const restriction = await getRestriction(auth.userId);
  if (restriction) {
    return mobileJson({ error: restrictionText(restriction) }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return mobileJson({ error: "Narxni to'g'ri kiriting" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.status !== "OPEN") {
    return mobileJson({ error: "Buyurtma takliflar uchun ochiq emas" }, { status: 400 });
  }

  const existing = await db.offer.findUnique({
    where: { orderId_preparerId: { orderId: id, preparerId: auth.userId } },
  });

  if (!existing) {
    const spend = await useStars({ userId: auth.userId, stars: MIN_OFFER_STARS });
    if (!spend.ok) {
      return mobileJson({ error: spend.error }, { status: 400 });
    }
  }

  const offer = await db.offer.upsert({
    where: { orderId_preparerId: { orderId: id, preparerId: auth.userId } },
    update: { price: parsed.data.price, message: parsed.data.message, status: "PENDING" },
    create: {
      orderId: id,
      preparerId: auth.userId,
      price: parsed.data.price,
      message: parsed.data.message,
      starsSpent: MIN_OFFER_STARS,
    },
  });

  await logActivity(
    auth.userId,
    existing ? "OFFER_UPDATE" : "OFFER_CREATE",
    `Taklif ${existing ? "yangiladi" : "yubordi"}: «${order.title}» — ${parsed.data.price.toLocaleString("ru-RU")} so'm (mobil ilova)`,
    { orderId: id, price: parsed.data.price },
  );

  const preparer = await db.user.findUnique({
    where: { id: auth.userId },
    select: { name: true, firstName: true, lastName: true, login: true, email: true },
  });
  const preparerName =
    preparer?.firstName || preparer?.name || (preparer?.login ? `@${preparer.login}` : "Tayyorlovchi");

  if (!existing) {
    await sendTelegramToUser(order.ordererId, {
      title: "🙋 Yangi ko'ngilli topildi",
      body:
        `«${order.title}» buyurtmangizga ${preparerName} taklif yubordi: ` +
        `${parsed.data.price.toLocaleString("ru-RU")} so'm` +
        (parsed.data.message ? `\n\n«${parsed.data.message}»` : ""),
      url: siteUrl(`/orders/${id}`),
      buttonLabel: "Ko'ngillilarni ko'rish",
    });
  }

  await logToGroup(
    "offers",
    existing ? "🙋 Taklif yangilandi (mobil)" : "🙋 Yangi taklif (mobil)",
    [
      `«${order.title}»`,
      `Tayyorlovchi: ${userLabel(preparer)}`,
      `Narx: ${parsed.data.price.toLocaleString("ru-RU")} so'm`,
      parsed.data.message ? `Xabar: ${parsed.data.message}` : "",
    ].filter(Boolean),
    siteUrl(`/sardorxon/admin/orders/${id}`),
  );

  return mobileJson({ offer: { id: offer.id } }, { status: existing ? 200 : 201 });
}
