import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { getSupportUserId } from "@/lib/support";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { logToGroup } from "@/lib/telegram-log";

const schema = z.object({
  direction: z.enum(["ADD", "SUBTRACT"]),
  amount: z.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
  notify: z.boolean().default(true),
});

/** Admin foydalanuvchi balansiga istalgan miqdorda mablag' qo'shadi/ayiradi, sababi bilan. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" },
      { status: 400 },
    );
  }
  const { direction, amount, reason, notify } = parsed.data;
  const positive = direction === "ADD";
  const delta = positive ? amount : -amount;

  const user = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { balance: { increment: delta } } });
    await tx.walletTransaction.create({
      data: {
        userId: id,
        type: positive ? "TRANSFER_IN" : "TRANSFER_OUT",
        amount,
        method: "ADMIN",
        note: reason,
      },
    });
  });

  if (notify) {
    const supportId = await getSupportUserId();
    const conv = await getOrCreateConversation(supportId, id);
    const msg = await createMessage({
      conversationId: conv.id,
      senderId: supportId,
      body:
        `💰 Hisobingiz${positive ? "ga" : "dan"} ${amount.toLocaleString("ru-RU")} so'm ` +
        `${positive ? "qo'shildi" : "ayirildi"}.\n\nSabab: ${reason}`,
      system: false,
    });
    await deliverMessage(msg);
  }

  await logToGroup(
    "payments",
    positive ? "➕ Admin balans qo'shdi" : "➖ Admin balans ayirdi",
    [`${amount.toLocaleString("ru-RU")} so'm`, `Sabab: ${reason}`],
  );

  return NextResponse.json({ ok: true });
}
