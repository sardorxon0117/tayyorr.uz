import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import { getRestriction, restrictionText } from "@/lib/restriction";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { updateOrderChannelPost } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";
import { logToGroup, siteUrl, userLabel } from "@/lib/telegram-log";

export { OPTIONS } from "@/lib/mobile-cors";

/** Buyurtmachi ishni yakunlaydi -> eskroudan tayyorlovchiga to'liq o'tadi — web bilan bir xil mantiq. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;
  const me = auth.userId;

  const restriction = await getRestriction(me);
  if (restriction) {
    return mobileJson({ error: restrictionText(restriction) }, { status: 403 });
  }

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { contracts: { where: { status: "ACCEPTED" } } },
  });
  if (!order) return mobileJson({ error: "Topilmadi" }, { status: 404 });
  if (order.ordererId !== me) {
    return mobileJson({ error: "Faqat buyurtma egasi yakunlaydi" }, { status: 403 });
  }
  if (!["IN_PROGRESS", "DELIVERED"].includes(order.status)) {
    return mobileJson({ error: "Buyurtma yakunlash holatida emas" }, { status: 400 });
  }
  const contract = order.contracts[0];
  if (!contract || !order.preparerId) {
    return mobileJson({ error: "Faol shartnoma yo'q" }, { status: 400 });
  }

  const payout = contract.amount;

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: "DONE" } });
    await tx.contract.update({ where: { id: contract.id }, data: { commissionAmount: 0, payoutAmount: payout } });
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
    `Ishni yakunladi: «${order.title}» — tayyorlovchiga ${payout.toLocaleString("ru-RU")} so'm (mobil ilova)`,
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
    "✅ Ish yakunlandi (mobil)",
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

  return mobileJson({ ok: true });
}
