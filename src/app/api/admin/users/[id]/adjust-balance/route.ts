import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { getSupportUserId } from "@/lib/support";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { logToGroup, siteUrl, userLabel } from "@/lib/telegram-log";

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

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, login: true, name: true, firstName: true, lastName: true, email: true, walletCode: true },
  });
  if (!user) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id },
      data: { balance: { increment: delta } },
      select: { balance: true },
    });
    await tx.walletTransaction.create({
      data: {
        userId: id,
        type: positive ? "TRANSFER_IN" : "TRANSFER_OUT",
        amount,
        method: "ADMIN",
        note: reason,
      },
    });
    return u;
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
    [
      `Foydalanuvchi: ${userLabel(user)}`,
      user.email ? `Email: ${user.email}` : "",
      user.walletCode ? `Hisob kodi: ${user.walletCode}` : "",
      `Summa: ${amount.toLocaleString("ru-RU")} so'm`,
      `Yangi balans: ${updated.balance.toLocaleString("ru-RU")} so'm`,
      `Sabab: ${reason}`,
      `Foydalanuvchiga xabar yuborildi: ${notify ? "ha" : "yo'q"}`,
      `Foydalanuvchi ID: ${user.id}`,
    ].filter(Boolean),
    siteUrl(`/sardorxon/admin/users/${user.id}`),
  );

  return NextResponse.json({ ok: true });
}
