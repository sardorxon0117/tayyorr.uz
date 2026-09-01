import Link from "next/link";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";

const TYPE_LABEL: Record<string, string> = {
  PRESENTATION: "Prezentatsiya",
  COURSE_WORK: "Kurs ishi",
  REFERAT: "Referat",
  ESSAY: "Esse",
  DIPLOMA: "Diplom ishi",
  OTHER: "Boshqa",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Ochiq",
  IN_PROGRESS: "Jarayonda",
  DELIVERED: "Topshirilgan",
  DONE: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
};

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

      {orders.length === 0 && (
        <div className="card text-sm text-zinc-500">
          Hozircha buyurtma yo'q.
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/orders/${o.id}`}
              className="card flex items-center justify-between gap-4 transition hover:border-white/15 hover:bg-white/[0.06]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-white">{o.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {TYPE_LABEL[o.type]} · {STATUS_LABEL[o.status]}
                  {isPreparer && ` · @${o.orderer.login ?? o.orderer.name}`}
                  {o.budget ? ` · ${o.budget.toLocaleString()} so'm` : ""}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                {o._count.offers} taklif
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
