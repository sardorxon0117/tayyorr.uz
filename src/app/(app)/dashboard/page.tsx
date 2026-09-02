import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";
import { OrdersBrowser, type OrderRow } from "@/components/orders-browser";

export default async function DashboardPage() {
  const session = await auth();
  const restriction = await getRestriction(session!.user.id);
  if (restriction) return <RestrictionNotice restriction={restriction} />;

  const me = session!.user;
  const isPreparer = me.role === "PREPARER";

  const orders = await db.order.findMany({
    where: isPreparer
      ? { OR: [{ status: "OPEN" }, { preparerId: me.id }] }
      : { ordererId: me.id },
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
    <OrdersBrowser
      orders={rows}
      title={isPreparer ? "Buyurtmalar" : "Buyurtmalarim"}
      newOrderHref={isPreparer ? undefined : "/orders/new"}
    />
  );
}
