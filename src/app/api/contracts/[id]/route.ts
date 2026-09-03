import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { getPlatformUserId, commission, COMMISSION_CANCEL } from "@/lib/platform";
import { updateOrderChannelPost } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";

const schema = z.object({ action: z.enum(["ACCEPT", "DECLINE", "CANCEL"]) });

async function systemMsg(ordererId: string, preparerId: string, orderId: string, senderId: string, body: string) {
  const conv = await getOrCreateConversation(ordererId, preparerId, orderId);
  const msg = await createMessage({ conversationId: conv.id, senderId, body, system: true });
  await deliverMessage(msg);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const restricted = await restrictionApiError(session.user.id);
  if (restricted) return restricted;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri amal" }, { status: 400 });
  }
  const me = session.user.id;
  const { action } = parsed.data;

  const contract = await db.contract.findUnique({
    where: { id },
    include: { order: true },
  });
  if (!contract) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const isOrderer = contract.ordererId === me;
  const isPreparer = contract.preparerId === me;

  // ---------- SENT holatidagi shartnoma ----------
  if (contract.status === "SENT") {
    // rad etish (tayyorlovchi) yoki bekor qilish (buyurtmachi) -> to'liq qaytariladi
    if (
      (action === "DECLINE" && isPreparer) ||
      (action === "CANCEL" && isOrderer)
    ) {
      await db.$transaction(async (tx) => {
        await tx.contract.update({
          where: { id },
          data: {
            status: action === "DECLINE" ? "DECLINED" : "CANCELLED",
            resolvedAt: new Date(),
            refundAmount: contract.amount,
          },
        });
        await tx.user.update({
          where: { id: contract.ordererId },
          data: { balance: { increment: contract.amount } },
        });
        await tx.walletTransaction.create({
          data: {
            userId: contract.ordererId,
            type: "REFUND",
            amount: contract.amount,
            method: "ESCROW",
            note:
              action === "DECLINE"
                ? "Tayyorlovchi shartnomani rad etdi — mablag' qaytdi"
                : "Shartnoma bekor qilindi — mablag' qaytdi",
          },
        });
      });
      await systemMsg(
        contract.ordererId,
        contract.preparerId,
        contract.orderId,
        me,
        action === "DECLINE"
          ? "📄 Shartnoma rad etildi. Bloklangan mablag' buyurtmachiga qaytarildi."
          : "📄 Shartnoma bekor qilindi. Bloklangan mablag' qaytarildi.",
      );
      await logActivity(
        me,
        action === "DECLINE" ? "CONTRACT_DECLINE" : "CONTRACT_CANCEL",
        `${action === "DECLINE" ? "Shartnomani rad etdi" : "Shartnomani bekor qildi"}: «${contract.order.title}»`,
        { orderId: contract.orderId, contractId: id },
      );
      return NextResponse.json({ ok: true });
    }

    // qabul qilish (tayyorlovchi) -> ish boshlanadi
    if (action === "ACCEPT" && isPreparer) {
      if (contract.order.status !== "OPEN") {
        return NextResponse.json({ error: "Buyurtma allaqachon band" }, { status: 400 });
      }
      await db.$transaction(async (tx) => {
        await tx.contract.update({
          where: { id },
          data: { status: "ACCEPTED", resolvedAt: new Date() },
        });
        await tx.contract.updateMany({
          where: { orderId: contract.orderId, status: "SENT", NOT: { id } },
          data: { status: "CANCELLED", resolvedAt: new Date() },
        });
        await tx.offer.updateMany({
          where: { orderId: contract.orderId, preparerId: me },
          data: { status: "ACCEPTED" },
        });
        await tx.offer.updateMany({
          where: { orderId: contract.orderId, NOT: { preparerId: me } },
          data: { status: "REJECTED" },
        });
        await tx.order.update({
          where: { id: contract.orderId },
          data: { status: "IN_PROGRESS", preparerId: me, budget: contract.amount },
        });
        await tx.user.update({ where: { id: me }, data: { isAvailable: false } });
      });
      await systemMsg(
        contract.ordererId,
        contract.preparerId,
        contract.orderId,
        me,
        "✅ Shartnoma qabul qilindi. Ish boshlandi. Yakuniga qadar shu chatда gaplashib turishingiz mumkin.",
      );
      await updateOrderChannelPost(contract.orderId);
      await logActivity(
        me,
        "CONTRACT_ACCEPT",
        `Shartnomani qabul qildi: «${contract.order.title}» — ${contract.amount.toLocaleString("ru-RU")} so'm`,
        { orderId: contract.orderId, contractId: id, amount: contract.amount },
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  // ---------- ACCEPTED holatidagi shartnomani buyurtmachi bekor qiladi ----------
  if (contract.status === "ACCEPTED" && action === "CANCEL" && isOrderer) {
    if (!["IN_PROGRESS", "DELIVERED"].includes(contract.order.status)) {
      return NextResponse.json({ error: "Hozir bekor qilib bo'lmaydi" }, { status: 400 });
    }
    const fee = commission(contract.amount, COMMISSION_CANCEL); // 2%
    const refund = contract.amount - fee;
    const platformId = await getPlatformUserId();

    await db.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id },
        data: {
          status: "CANCELLED",
          resolvedAt: new Date(),
          commissionAmount: fee,
          refundAmount: refund,
        },
      });
      await tx.order.update({
        where: { id: contract.orderId },
        data: { status: "CANCELLED" },
      });
      await tx.user.update({
        where: { id: contract.preparerId },
        data: { isAvailable: true },
      });
      // 2% saytga
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
          note: `Bekor qilish komissiyasi 2% (shartnoma: ${contract.id})`,
        },
      });
      // qolgani buyurtmachiga
      await tx.user.update({
        where: { id: contract.ordererId },
        data: { balance: { increment: refund } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: contract.ordererId,
          type: "REFUND",
          amount: refund,
          method: "ESCROW",
          note: "Shartnoma bekor qilindi (2% komissiya ushlab qolindi)",
        },
      });
    });

    await systemMsg(
      contract.ordererId,
      contract.preparerId,
      contract.orderId,
      me,
      `📄 Shartnoma bekor qilindi. ${fee.toLocaleString("ru-RU")} so'm (2%) sayt komissiyasi, ${refund.toLocaleString("ru-RU")} so'm buyurtmachiga qaytarildi.`,
    );
    await updateOrderChannelPost(contract.orderId);
    await logActivity(
      me,
      "CONTRACT_CANCEL",
      `Shartnomani bekor qildi (ish jarayonida): «${contract.order.title}»`,
      { orderId: contract.orderId, contractId: id, fee, refund },
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Shartnoma allaqachon hal qilingan" },
    { status: 400 },
  );
}
