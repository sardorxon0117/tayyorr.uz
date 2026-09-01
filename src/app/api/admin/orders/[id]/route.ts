import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";

/** Buyurtmani butunlay o'chiradi. Faol/yuborilgan shartnomalardagi bloklangan
 *  mablag' buyurtmachiga qaytariladi. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { contracts: { where: { status: { in: ["SENT", "ACCEPTED"] } } } },
  });
  if (!order) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  await db.$transaction(async (tx) => {
    for (const c of order.contracts) {
      await tx.user.update({
        where: { id: c.ordererId },
        data: { balance: { increment: c.amount } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: c.ordererId,
          type: "REFUND",
          amount: c.amount,
          method: "ESCROW",
          note: "Buyurtma admin tomonidan o'chirildi — bloklangan mablag' qaytdi",
        },
      });
    }
    await tx.order.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
