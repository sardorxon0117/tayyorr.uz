import { db } from "@/lib/db";
import { getPlatformUserId } from "@/lib/platform";

/** 1 star narxi (so'm). */
export const STAR_PRICE = 2_000;

/** Buyurtmaga taklif (ariza) yuborish uchun majburiy minimal star. */
export const MIN_OFFER_STARS = 2;

/**
 * Foydalanuvchi so'm hamyonidan star sotib oladi — bu YAGONA joy, qayerda
 * pul haqiqatan ham sayt hisobiga (platform) o'tadi. Sotib olingan starlar
 * `starBalance`ga tushadi va keyin ariza/navbat uchun bepul sarflanadi
 * ([[useStars]]) — ya'ni harid va sarflash ikki alohida qadam.
 */
export async function buyStars(opts: {
  userId: string;
  stars: number;
}): Promise<{ ok: true; newSom: number; newStars: number } | { ok: false; error: string }> {
  if (opts.stars <= 0 || !Number.isInteger(opts.stars)) {
    return { ok: false, error: "Star soni noto'g'ri" };
  }
  const amount = opts.stars * STAR_PRICE;

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
      data: { balance: { decrement: amount }, starBalance: { increment: opts.stars } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: opts.userId,
        type: "SPEND",
        amount,
        method: "STAR",
        note: `${opts.stars} ⭐ sotib olindi`,
        meta: { stars: opts.stars },
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
        note: `Star sotildi — ${opts.stars} ⭐ (${opts.userId})`,
        meta: { stars: opts.stars, fromUserId: opts.userId },
      },
    });
    return u;
  });

  return { ok: true, newSom: updated.balance, newStars: updated.starBalance };
}

/**
 * Oldindan sotib olingan star balansidan sarflaydi (pul harakat qilmaydi —
 * pul allaqachon [[buyStars]] vaqtida sayt hisobiga o'tgan). Ariza yuborish
 * va navbatda yuqoriga chiqish shu orqali ishlaydi.
 */
export async function useStars(opts: {
  userId: string;
  stars: number;
}): Promise<{ ok: true; newStars: number } | { ok: false; error: string }> {
  if (opts.stars <= 0 || !Number.isInteger(opts.stars)) {
    return { ok: false, error: "Star soni noto'g'ri" };
  }

  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: { starBalance: true },
  });
  if (!user || user.starBalance < opts.stars) {
    const missing = opts.stars - (user?.starBalance ?? 0);
    return {
      ok: false,
      error: `Star yetarli emas — yana ${missing} ⭐ kerak. Avval hamyon bo'limidan star sotib oling.`,
    };
  }

  const updated = await db.user.update({
    where: { id: opts.userId },
    data: { starBalance: { decrement: opts.stars } },
  });

  return { ok: true, newStars: updated.starBalance };
}
