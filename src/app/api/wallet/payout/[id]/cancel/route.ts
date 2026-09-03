import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const { id } = await params;

  const p = await db.payoutRequest.findUnique({ where: { id } });
  if (!p || p.userId !== session.user.id) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  if (p.status !== "PENDING") {
    return NextResponse.json({ error: "Bu so'rovni bekor qilib bo'lmaydi" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.payoutRequest.update({
      where: { id },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
    await tx.user.update({
      where: { id: p.userId },
      data: { balance: { increment: p.amount } },
    });
    await tx.walletTransaction.updateMany({
      where: {
        userId: p.userId,
        type: "PAYOUT",
        status: "PENDING",
        meta: { path: ["payoutId"], equals: id },
      },
      data: { status: "FAILED", reversedAt: new Date() },
    });
    await tx.walletTransaction.create({
      data: {
        userId: p.userId,
        type: "REFUND",
        amount: p.amount,
        method: "CARD",
        note: "Yechib olish so'rovi bekor qilindi",
      },
    });
  });

  await logActivity(
    session.user.id,
    "PAYOUT_CANCEL",
    `Yechish so'rovini bekor qildi: ${p.amount.toLocaleString("ru-RU")} so'm`,
    { amount: p.amount, payoutId: id },
  );

  return NextResponse.json({ ok: true });
}
