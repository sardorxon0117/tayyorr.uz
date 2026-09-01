import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { maskCard } from "@/lib/wallet";

const MIN = 10_000;

const schema = z.object({
  amount: z.coerce.number().int().positive(),
  card: z.string().min(12).max(25),
  cardName: z.string().trim().max(100).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const restricted = await restrictionApiError(session.user.id);
  if (restricted) return restricted;
  const me = session.user.id;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ma'lumot noto'g'ri" }, { status: 400 });
  }
  const { amount, cardName } = parsed.data;
  const card = parsed.data.card.replace(/\D/g, "");
  if (card.length < 16) {
    return NextResponse.json({ error: "Karta raqami 16 raqamdan iborat bo'lsin" }, { status: 400 });
  }
  if (amount < MIN) {
    return NextResponse.json(
      { error: `Eng kami ${MIN.toLocaleString("ru-RU")} so'm` },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({
    where: { id: me },
    select: { balance: true },
  });
  if (!user || user.balance < amount) {
    return NextResponse.json({ error: "Hisobda yetarli mablag' yo'q" }, { status: 400 });
  }

  const payout = await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: me },
      data: { balance: { decrement: amount } },
    });
    const p = await tx.payoutRequest.create({
      data: { userId: me, amount, card, cardName: cardName || null },
    });
    await tx.walletTransaction.create({
      data: {
        userId: me,
        type: "PAYOUT",
        status: "PENDING",
        amount,
        method: "CARD",
        note: `Yechib olish so'rovi — ${maskCard(card)}`,
        meta: { payoutId: p.id, card: maskCard(card) },
      },
    });
    return p;
  });

  return NextResponse.json({ ok: true, payoutId: payout.id });
}
