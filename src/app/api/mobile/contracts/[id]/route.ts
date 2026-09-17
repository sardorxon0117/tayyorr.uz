import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import { getRestriction, restrictionText } from "@/lib/restriction";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { updateOrderChannelPost } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";
import { logToGroup, siteUrl, userLabel } from "@/lib/telegram-log";
import { refundOfferStars } from "@/lib/stars";

export { OPTIONS } from "@/lib/mobile-cors";

const schema = z.object({ action: z.enum(["ACCEPT", "DECLINE", "CANCEL"]) });

async function systemMsg(ordererId: string, preparerId: string, orderId: string, senderId: string, body: string) {
  const conv = await getOrCreateConversation(ordererId, preparerId, orderId);
  const msg = await createMessage({ conversationId: conv.id, senderId, body, system: true });
  await deliverMessage(msg);
}

/** Shartnomani qabul qilish/rad etish/bekor qilish — web /api/contracts/[id] bilan bir xil mantiq. */
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
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Noto'g'ri amal" }, { status: 400 });
  const { action } = parsed.data;

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      order: true,
      orderer: { select: { login: true, name: true, firstName: true, lastName: true, email: true } },
      preparer: { select: { login: true, name: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!contract) return mobileJson({ error: "Topilmadi" }, { status: 404 });

  const isOrderer = contract.ordererId === me;
  const isPreparer = contract.preparerId === me;

  if (contract.status === "SENT") {
    if ((action === "DECLINE" && isPreparer) || (action === "CANCEL" && isOrderer)) {
      await db.$transaction(async (tx) => {
        await tx.contract.update({
          where: { id },
          data: {
            status: action === "DECLINE" ? "DECLINED" : "CANCELLED",
            resolvedAt: new Date(),
            refundAmount: contract.amount,
          },
        });
        await tx.user.update({ where: { id: contract.ordererId }, data: { balance: { increment: contract.amount } } });
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
        `${action === "DECLINE" ? "Shartnomani rad etdi" : "Shartnomani bekor qildi"}: «${contract.order.title}» (mobil ilova)`,
        { orderId: contract.orderId, contractId: id },
      );
      await logToGroup(
        "contracts",
        action === "DECLINE" ? "📄 Shartnoma rad etildi (mobil)" : "📄 Shartnoma bekor qilindi (mobil)",
        [
          `«${contract.order.title}»`,
          `Buyurtmachi: ${userLabel(contract.orderer)}`,
          `Tayyorlovchi: ${userLabel(contract.preparer)}`,
          `${contract.amount.toLocaleString("ru-RU")} so'm qaytarildi`,
          `Shartnoma ID: ${contract.id}`,
        ],
        siteUrl(`/sardorxon/admin/orders/${contract.orderId}`),
      );
      return mobileJson({ ok: true });
    }

    if (action === "ACCEPT" && isPreparer) {
      if (contract.order.status !== "OPEN") {
        return mobileJson({ error: "Buyurtma allaqachon band" }, { status: 400 });
      }
      await db.$transaction(async (tx) => {
        await tx.contract.update({ where: { id }, data: { status: "ACCEPTED", resolvedAt: new Date() } });
        await tx.contract.updateMany({
          where: { orderId: contract.orderId, status: "SENT", NOT: { id } },
          data: { status: "CANCELLED", resolvedAt: new Date() },
        });
        await tx.offer.updateMany({ where: { orderId: contract.orderId, preparerId: me }, data: { status: "ACCEPTED" } });
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
        "✅ Shartnoma qabul qilindi. Ish boshlandi. Yakuniga qadar shu chatda gaplashib turishingiz mumkin.",
      );
      await updateOrderChannelPost(contract.orderId);
      await logActivity(
        me,
        "CONTRACT_ACCEPT",
        `Shartnomani qabul qildi: «${contract.order.title}» — ${contract.amount.toLocaleString("ru-RU")} so'm (mobil ilova)`,
        { orderId: contract.orderId, contractId: id, amount: contract.amount },
      );
      await logToGroup(
        "contracts",
        "✅ Shartnoma qabul qilindi (mobil)",
        [
          `«${contract.order.title}»`,
          `Buyurtmachi: ${userLabel(contract.orderer)}`,
          `Tayyorlovchi: ${userLabel(contract.preparer)}`,
          `${contract.amount.toLocaleString("ru-RU")} so'm`,
          `Shartnoma ID: ${contract.id}`,
        ],
        siteUrl(`/sardorxon/admin/orders/${contract.orderId}`),
      );
      return mobileJson({ ok: true });
    }

    return mobileJson({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  if (contract.status === "ACCEPTED" && action === "CANCEL" && isOrderer) {
    if (!["IN_PROGRESS", "DELIVERED"].includes(contract.order.status)) {
      return mobileJson({ error: "Hozir bekor qilib bo'lmaydi" }, { status: 400 });
    }
    const refund = contract.amount;

    await db.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id },
        data: { status: "CANCELLED", resolvedAt: new Date(), commissionAmount: 0, refundAmount: refund },
      });
      await tx.order.update({ where: { id: contract.orderId }, data: { status: "CANCELLED" } });
      await tx.user.update({ where: { id: contract.preparerId }, data: { isAvailable: true } });
      await tx.user.update({ where: { id: contract.ordererId }, data: { balance: { increment: refund } } });
      await tx.walletTransaction.create({
        data: {
          userId: contract.ordererId,
          type: "REFUND",
          amount: refund,
          method: "ESCROW",
          note: "Shartnoma bekor qilindi — mablag' to'liq qaytdi",
        },
      });
    });

    await systemMsg(
      contract.ordererId,
      contract.preparerId,
      contract.orderId,
      me,
      `📄 Shartnoma bekor qilindi. ${refund.toLocaleString("ru-RU")} so'm to'liq buyurtmachiga qaytarildi.`,
    );
    await updateOrderChannelPost(contract.orderId);
    await refundOfferStars(contract.orderId, "bekor qilindi");
    await logActivity(
      me,
      "CONTRACT_CANCEL",
      `Shartnomani bekor qildi (ish jarayonida): «${contract.order.title}» (mobil ilova)`,
      { orderId: contract.orderId, contractId: id, refund },
    );
    await logToGroup(
      "contracts",
      "📄 Shartnoma bekor qilindi (jarayonda, mobil)",
      [
        `«${contract.order.title}»`,
        `Buyurtmachi: ${userLabel(contract.orderer)}`,
        `Tayyorlovchi: ${userLabel(contract.preparer)}`,
        `Qaytarildi (komissiyasiz, to'liq): ${refund.toLocaleString("ru-RU")} so'm`,
        `Shartnoma ID: ${contract.id}`,
      ],
      siteUrl(`/sardorxon/admin/orders/${contract.orderId}`),
    );
    return mobileJson({ ok: true });
  }

  return mobileJson({ error: "Shartnoma allaqachon hal qilingan" }, { status: 400 });
}
