import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";

const schema = z.object({
  preparerId: z.string().min(1),
  amount: z.coerce.number().int().positive().max(1_000_000_000),
  note: z.string().trim().max(4000).optional(),
  deadline: z.string().datetime().optional(),
});

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
  const me = session.user.id;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" },
      { status: 400 },
    );
  }
  const { preparerId, amount, note, deadline } = parsed.data;

  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (order.ordererId !== me) {
    return NextResponse.json({ error: "Faqat buyurtma egasi" }, { status: 403 });
  }
  if (order.status !== "OPEN") {
    return NextResponse.json({ error: "Buyurtma allaqachon jarayonda" }, { status: 400 });
  }

  const offer = await db.offer.findUnique({
    where: { orderId_preparerId: { orderId: id, preparerId } },
  });
  if (!offer) {
    return NextResponse.json(
      { error: "Bu tayyorlovchi taklif yubormagan" },
      { status: 400 },
    );
  }

  const orderer = await db.user.findUnique({
    where: { id: me },
    select: { balance: true },
  });
  if (!orderer || orderer.balance < amount) {
    return NextResponse.json(
      {
        error:
          "Hisobingizda yetarli mablag' yo'q. Avval Hamyon bo'limидан hisobни to'ldiring.",
      },
      { status: 400 },
    );
  }

  const contract = await db.$transaction(async (tx) => {
    // avvalgi yuborilgan (bloklangan) shartnomalarni bekor qilib, pulni qaytaramiz
    const prev = await tx.contract.findMany({
      where: { orderId: id, status: "SENT" },
    });
    for (const p of prev) {
      await tx.contract.update({
        where: { id: p.id },
        data: { status: "CANCELLED", resolvedAt: new Date(), refundAmount: p.amount },
      });
      await tx.user.update({
        where: { id: p.ordererId },
        data: { balance: { increment: p.amount } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: p.ordererId,
          type: "REFUND",
          amount: p.amount,
          method: "ESCROW",
          note: "Shartnoma almashtirildi — bloklangan mablag' qaytdi",
        },
      });
    }

    // yangi summani eskrouga bloklaymiz
    await tx.user.update({
      where: { id: me },
      data: { balance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: me,
        type: "HOLD",
        amount,
        method: "ESCROW",
        note: `Shartnoma bo'yicha bloklandi (buyurtma: ${order.title})`,
      },
    });

    return tx.contract.create({
      data: {
        orderId: id,
        ordererId: me,
        preparerId,
        amount,
        note: note || null,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
  });

  const conv = await getOrCreateConversation(me, preparerId, id);
  const msg = await createMessage({
    conversationId: conv.id,
    senderId: me,
    body:
      `📄 Shartnoma yuborildi. Kelishilgan summa: ${amount.toLocaleString("ru-RU")} so'm ` +
      `(hisobingizdan bloklandi, ish yakunlangач tayyorlovchiga o'tadi).` +
      (note ? `\n\nTavsif: ${note}` : "") +
      `\n\nQabul qilsangiz, ish boshlanadi.`,
    system: true,
  });
  await deliverMessage(msg);

  return NextResponse.json({ contract, conversationId: conv.id });
}
