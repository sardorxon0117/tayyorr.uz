import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { getPlatformUserId, commission, COMMISSION_FINAL } from "@/lib/platform";
import { updateOrderChannelPost } from "@/lib/telegram";

/** Buyurtmachi ishni yakunlaydi -> eskroudan tayyorlovchiga (95%), saytga (5%). */
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

  const fee = commission(contract.amount, COMMISSION_FINAL); // 5%
  const payout = contract.amount - fee;
  const platformId = await getPlatformUserId();

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: "DONE" } });
    await tx.contract.update({
      where: { id: contract.id },
      data: { commissionAmount: fee, payoutAmount: payout },
    });
    // tayyorlovchiga
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
        note: `Ish yakunlandi: ${order.title} (5% komissiya ushlanди)`,
      },
    });
    // saytga
    await tx.user.update({
      where: { id: platformId },
      data: { balance: { increment: fee } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: platformId,
        type: "COMMISSION",
        amount: fee,
        method: "ESCROW",
        note: `Yakuniy komissiya 5% (shartnoma: ${contract.id})`,
      },
    });
  });

  const conv = await getOrCreateConversation(me, order.preparerId, id);
  const msg = await createMessage({
    conversationId: conv.id,
    senderId: me,
    body: `🎉 Buyurtma yakunlandi. ${payout.toLocaleString("ru-RU")} so'm tayyorlovchi hisobiga o'tkazildi (5% sayt komissiyasi).`,
    system: true,
  });
  await deliverMessage(msg);

  await updateOrderChannelPost(id);

  return NextResponse.json({ ok: true });
}
