import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { getSupportUserId } from "@/lib/support";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";

const schema = z.object({
  action: z.enum(["PAID", "REJECT"]),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri amal" }, { status: 400 });
  }
  const { action, note } = parsed.data;

  const p = await db.payoutRequest.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (p.status !== "PENDING") {
    return NextResponse.json({ error: "Allaqachon hal qilingan" }, { status: 400 });
  }

  if (action === "PAID") {
    await db.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id },
        data: { status: "PAID", resolvedAt: new Date(), adminNote: note || null },
      });
      await tx.walletTransaction.updateMany({
        where: {
          userId: p.userId,
          type: "PAYOUT",
          status: "PENDING",
          meta: { path: ["payoutId"], equals: id },
        },
        data: { status: "SUCCESS" },
      });
    });
  } else {
    await db.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id },
        data: { status: "REJECTED", resolvedAt: new Date(), adminNote: note || null },
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
          note: `Yechib olish rad etildi${note ? `: ${note}` : ""}`,
        },
      });
    });
  }

  // foydalanuvchiga support xabari + push
  const supportId = await getSupportUserId();
  const conv = await getOrCreateConversation(supportId, p.userId);
  const body =
    action === "PAID"
      ? `💳 ${p.amount.toLocaleString("ru-RU")} so'm kartangizga o'tkazildi.`
      : `💳 ${p.amount.toLocaleString("ru-RU")} so'm yechib olish so'rovi rad etildi, mablag' hisobingizga qaytarildi.${note ? ` Sabab: ${note}` : ""}`;
  const msg = await createMessage({
    conversationId: conv.id,
    senderId: supportId,
    body,
    system: true,
  });
  await deliverMessage(msg);

  return NextResponse.json({ ok: true });
}
