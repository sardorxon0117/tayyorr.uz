import { db } from "@/lib/db";
import { getPlatformUserId } from "@/lib/platform";

/** 1 star narxi (so'm). Hamyondagi mavjud balansdan yechiladi — alohida
 * "star hamyoni" yo'q, shunchaki belgilangan narxda hisobdan pul ketadi. */
export const STAR_PRICE = 2_000;

/** Buyurtmaga taklif (ariza) yuborish uchun majburiy minimal star. */
export const MIN_OFFER_STARS = 2;

/**
 * Foydalanuvchi hisobidan `stars` dona star narxini yechib, sayt hisobiga
 * (platform) o'tkazadi. Ikkala tomon uchun ham WalletTransaction yozadi.
 * Yetarli mablag' bo'lmasa xatolik qaytaradi, hech narsa o'zgartirmaydi.
 */
export async function spendStars(opts: {
  userId: string;
  stars: number;
  reason: string; // masalan: "Buyurtmaga ariza" yoki "Navbatda yuqoriga chiqish"
  meta?: Record<string, unknown>;
}): Promise<{ ok: true; newBalance: number; amount: number } | { ok: false; error: string }> {
  const amount = opts.stars * STAR_PRICE;
  if (opts.stars <= 0 || !Number.isInteger(opts.stars)) {
    return { ok: false, error: "Star soni noto'g'ri" };
  }

  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: { balance: true },
  });
  if (!user || user.balance < amount) {
    return {
      ok: false,
      error: `Hisobda yetarli mablag' yo'q. ${opts.stars} ⭐ = ${amount.toLocaleString("ru-RU")} so'm kerak.`,
    };
  }

  const platformId = await getPlatformUserId();

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: opts.userId },
      data: { balance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: opts.userId,
        type: "SPEND",
        amount,
        method: "STAR",
        note: `${opts.reason} — ${opts.stars} ⭐`,
        meta: { stars: opts.stars, ...opts.meta },
      },
    });
    await tx.user.update({
      where: { id: platformId },
      data: { balance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: platformId,
        type: "COMMISSION",
        amount,
        method: "STAR",
        note: `${opts.reason} — ${opts.stars} ⭐ (${opts.userId})`,
        meta: { stars: opts.stars, fromUserId: opts.userId, ...opts.meta },
      },
    });
    return u;
  });

  return { ok: true, newBalance: updated.balance, amount };
}
