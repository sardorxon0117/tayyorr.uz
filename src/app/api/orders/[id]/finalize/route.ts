import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { updateOrderChannelPost } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";
import { logToGroup, siteUrl, userLabel } from "@/lib/telegram-log";

/** Buyurtmachi ishni yakunlaydi -> eskroudan tayyorlovchiga to'liq (100%) o'tadi. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const restricted = await restrictionApiError(session.user.id);
  if (restricted) return restricted;
  const me = session.user.id;
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { contracts: { where: { status: "ACCEPTED" } } },
  });
  if (!order) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (order.ordererId !== me) {
    return NextResponse.json({ error: "Faqat buyurtma egasi yakunlaydi" }, { status: 403 });
  }
  if (!["IN_PROGRESS", "DELIVERED"].includes(order.status)) {
    return NextResponse.json({ error: "Buyurtma yakunlash holatida emas" }, { status: 400 });
  }
  const contract = order.contracts[0];
  if (!contract || !order.preparerId) {
    return NextResponse.json({ error: "Faol shartnoma yo'q" }, { status: 400 });
  }

  const payout = contract.amount; // komissiyasiz — to'liq summa tayyorlovchiga

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: "DONE" } });
    await tx.contract.update({
      where: { id: contract.id },
      data: { commissionAmount: 0, payoutAmount: payout },
    });
    await tx.user.update({
      where: { id: order.preparerId! },
      data: { balance: { increment: payout }, isAvailable: true },
    });
    await tx.walletTransaction.create({
      data: {
        userId: order.preparerId!,
        type: "RELEASE",
        amount: payout,
        method: "ESCROW",
        note: `Ish yakunlandi: ${order.title} (komissiyasiz, to'liq)`,
      },
    });
  });

  const conv = await getOrCreateConversation(me, order.preparerId, id);
  const msg = await createMessage({
    conversationId: conv.id,
    senderId: me,
    body: `🎉 Buyurtma yakunlandi. ${payout.toLocaleString("ru-RU")} so'm to'liq tayyorlovchi hisobiga o'tkazildi.`,
    system: true,
  });
  await deliverMessage(msg);

  await updateOrderChannelPost(id);

  await logActivity(
    me,
    "ORDER_FINALIZE",
    `Ishni yakunladi: «${order.title}» — tayyorlovchiga ${payout.toLocaleString("ru-RU")} so'm`,
    { orderId: id, payout },
  );
  const [orderer, preparer] = await Promise.all([
    db.user.findUnique({
      where: { id: me },
      select: { login: true, name: true, firstName: true, lastName: true, email: true },
    }),
    db.user.findUnique({
      where: { id: order.preparerId },
      select: { login: true, name: true, firstName: true, lastName: true, email: true },
    }),
  ]);

  await logToGroup(
    "completed",
    "✅ Ish yakunlandi",
    [
      `«${order.title}»`,
      `Buyurtmachi: ${userLabel(orderer)}`,
      `Tayyorlovchi: ${userLabel(preparer)}`,
      `Tayyorlovchiga (komissiyasiz, to'liq): ${payout.toLocaleString("ru-RU")} so'm`,
      `Buyurtma ID: ${id}`,
      `Shartnoma ID: ${contract.id}`,
    ],
    siteUrl(`/sardorxon/admin/orders/${id}`),
  );

  return NextResponse.json({ ok: true });
}
