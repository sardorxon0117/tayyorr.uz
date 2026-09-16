import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";

export { OPTIONS } from "@/lib/mobile-cors";

/** Bosh sahifa uchun buyurtmalar ro'yxati — web dashboard bilan bir xil mantiq. */
export async function GET(req: Request) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;

  const me = await db.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!me) return mobileJson({ error: "Topilmadi" }, { status: 404 });

  const isPreparer = me.role === "PREPARER";

  const orders = await db.order.findMany({
    where: isPreparer
      ? { deletedAt: null, OR: [{ status: "OPEN" }, { preparerId: auth.userId }] }
      : { ordererId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      orderer: { select: { name: true, login: true } },
      _count: { select: { offers: true } },
    },
  });

  return mobileJson({
    orders: orders.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      type: o.type,
      status: o.status,
      budget: o.budget,
      offers: o._count.offers,
      createdAt: o.createdAt.toISOString(),
      ordererLabel: isPreparer ? o.orderer.login ?? o.orderer.name ?? null : null,
      deleted: !!o.deletedAt,
    })),
  });
}
