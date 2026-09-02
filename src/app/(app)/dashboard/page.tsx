import Link from "next/link";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureWalletCode, formatSom } from "@/lib/wallet";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";
import { AvailabilityToggle } from "@/components/availability-toggle";
import { OrdersBrowser, type OrderRow } from "@/components/orders-browser";

export default async function DashboardPage() {
  const session = await auth();
  const restriction = await getRestriction(session!.user.id);
  if (restriction) return <RestrictionNotice restriction={restriction} />;

  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    include: {
      _count: {
        select: { ordersCreated: true, ordersTaken: true, offers: true },
      },
    },
  });
  if (!user) return null;

  const walletCode = await ensureWalletCode(user.id);
  const isPreparer = user.role === "PREPARER";

  const orders = await db.order.findMany({
    where: isPreparer
      ? { OR: [{ status: "OPEN" }, { preparerId: user.id }] }
      : { ordererId: user.id },
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ---- chet: hisob ma'lumotlari ---- */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              {user.firstName || user.name}
            </h1>
            <p className="text-xs text-zinc-500">
              {isPreparer ? "Tayyorlovchi" : "Buyurtma beruvchi"} kabineti
            </p>
          </div>
          {isPreparer && <AvailabilityToggle initial={user.isAvailable} />}
        </div>

        <div className="rounded-2xl glass-strong p-4">
          <div className="text-xs text-zinc-400">Hisobingizdagi pul</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {formatSom(user.balance)}
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-500">
            Hisob kodi:{" "}
            <span className="font-mono text-zinc-300">{walletCode}</span>
          </div>
          <Link href="/wallet" className="btn-white mt-3 w-full text-center text-sm">
            Hisobni to'ldirish
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {isPreparer ? (
            <>
              <Stat label="Yuborilgan takliflar" value={user._count.offers} />
              <Stat label="Olingan ishlar" value={user._count.ordersTaken} />
              <Stat
                label="Reyting"
                value={
                  user.ratingCount
                    ? (user.ratingSum / user.ratingCount).toFixed(1)
                    : "—"
                }
              />
            </>
          ) : (
            <Stat label="Buyurtmalarim" value={user._count.ordersCreated} />
          )}
        </div>

        {!isPreparer && (
          <Link href="/orders/new" className="btn-primary w-full text-center">
            + Yangi buyurtma
          </Link>
        )}
      </aside>

      {/* ---- asosiy: buyurtmalar (saralash / qidiruv) ---- */}
      <div className="min-w-0 flex-1">
        <h2 className="mb-3 text-lg font-semibold text-white">
          {isPreparer ? "Buyurtmalar" : "Buyurtmalarim"}
        </h2>
        <OrdersBrowser orders={rows} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
