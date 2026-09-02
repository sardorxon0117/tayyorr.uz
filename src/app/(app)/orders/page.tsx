import Link from "next/link";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";
import { OrdersBrowser, type OrderRow } from "@/components/orders-browser";

export default async function OrdersPage() {
  const session = await auth();
  const restriction = await getRestriction(session!.user.id);
  if (restriction) return <RestrictionNotice restriction={restriction} />;
  const isPreparer = session!.user.role === "PREPARER";

  const orders = await db.order.findMany({
    where: isPreparer
      ? { OR: [{ status: "OPEN" }, { preparerId: session!.user.id }] }
      : { ordererId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      orderer: { select: { name: true, login: true } },
      _count: { select: { offers: true } },
    },
  });

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    type: o.type,
    status: o.status,
    budget: o.budget,
    offers: o._count.offers,
    createdAt: o.createdAt.toISOString(),
    ordererLabel: isPreparer ? o.orderer.login ?? o.orderer.name ?? null : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {isPreparer ? "Buyurtmalar" : "Buyurtmalarim"}
        </h1>
        {!isPreparer && (
          <Link href="/orders/new" className="btn-primary">
            + Yangi buyurtma
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="card text-sm text-zinc-500">Hozircha buyurtma yo'q.</div>
      ) : (
        <OrdersBrowser orders={rows} />
      )}
    </div>
  );
}
