import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { luhnValid, maskCard } from "@/lib/wallet";

/**
 * DEMO hisobni to'ldirish. Haqiqiy pul yechilmaydi.
 * Click integratsiyasi tayyor bo'lgach bu endpoint /api/wallet/click/* bilan
 * almashtiriladi (WalletTransaction sxemasi o'zgarmaydi).
 */

const MIN = 1_000;
const MAX = 10_000_000;

const schema = z.object({
  // qaysi hisob to'ldiriladi: hamyon kodi yoki bo'sh (o'ziniki)
  walletCode: z.string().trim().max(20).optional(),
  cardNumber: z.string().min(12).max(25),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "MM/YY formatida kiriting"),
  amount: z.coerce.number().int(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  const { walletCode, cardNumber, expiry, amount } = parsed.data;

  if (amount < MIN || amount > MAX) {
    return NextResponse.json(
      { error: `Summa ${MIN.toLocaleString()} – ${MAX.toLocaleString()} so'm oralig'ida bo'lsin` },
      { status: 400 },
    );
  }

  const digits = cardNumber.replace(/\D/g, "");
  if (!luhnValid(digits)) {
    return NextResponse.json({ error: "Karta raqami noto'g'ri" }, { status: 400 });
  }

  const [mm, yy] = expiry.split("/").map(Number);
  if (mm < 1 || mm > 12) {
    return NextResponse.json({ error: "Amal qilish muddati noto'g'ri" }, { status: 400 });
  }
  const exp = new Date(2000 + yy, mm, 0, 23, 59, 59);
  if (exp.getTime() < Date.now()) {
    return NextResponse.json({ error: "Karta muddati o'tgan" }, { status: 400 });
  }

  // maqsad foydalanuvchi
  const target =
    walletCode && walletCode.length > 0
      ? await db.user.findUnique({ where: { walletCode: walletCode.toUpperCase() } })
      : await db.user.findUnique({ where: { id: session.user.id } });

  if (!target) {
    return NextResponse.json({ error: "Bunday hisob kodi topilmadi" }, { status: 404 });
  }

  const result = await db.$transaction(async (tx) => {
    await tx.walletTransaction.create({
      data: {
        userId: target.id,
        type: "TOPUP",
        status: "SUCCESS",
        amount,
        method: "DEMO",
        note:
          target.id === session.user!.id
            ? "Demo to'ldirish"
            : `Demo to'ldirish (${session.user!.login ?? session.user!.id})`,
        meta: { card: maskCard(digits), demo: true },
      },
    });
    const u = await tx.user.update({
      where: { id: target.id },
      data: { balance: { increment: amount } },
      select: { balance: true },
    });
    return u;
  });

  return NextResponse.json({
    ok: true,
    targetBalance: result.balance,
    self: target.id === session.user.id,
  });
}
