import Link from "next/link";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureWalletCode, formatSom } from "@/lib/wallet";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";
import { AvailabilityToggle } from "@/components/availability-toggle";

export default async function DashboardPage() {
  const session = await auth();
  const restriction = await getRestriction(session!.user.id);
  if (restriction) return <RestrictionNotice restriction={restriction} />;
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    include: {
      _count: {
        select: {
          ordersCreated: true,
          ordersTaken: true,
          offers: true,
        },
      },
    },
  });
  if (!user) return null;

  const walletCode = await ensureWalletCode(user.id);
  const isPreparer = user.role === "PREPARER";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Salom, {user.firstName || user.name}!
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isPreparer ? "Tayyorlovchi" : "Buyurtma beruvchi"} kabineti
          </p>
        </div>
        {isPreparer && <AvailabilityToggle initial={user.isAvailable} />}
      </div>

      {/* hisob (balans) */}
      <div className="relative overflow-hidden rounded-2xl glass-strong p-6">
        <div
          aria-hidden
          className="blob"
          style={{
            top: "-9rem",
            right: "-7rem",
            width: "24rem",
            height: "24rem",
            background: "radial-gradient(circle, #6366f1, transparent 70%)",
            opacity: 0.3,
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">Hisobingizdagi pul</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {formatSom(user.balance)}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Hisob kodi: <span className="font-mono text-zinc-300">{walletCode}</span>
            </div>
          </div>
          <Link href="/wallet" className="btn-white">
            Hisobni to'ldirish
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
          <>
            <Stat label="Buyurtmalarim" value={user._count.ordersCreated} />
            <Link
              href="/orders/new"
              className="card flex items-center justify-center gap-2 font-medium text-indigo-300 transition hover:bg-white/[0.06]"
            >
              + Yangi buyurtma
            </Link>
          </>
        )}
      </div>

      <Link href="/orders" className="btn-primary w-fit">
        {isPreparer ? "Ochiq buyurtmalarni ko'rish" : "Buyurtmalarim"}
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-zinc-500">{label}</div>
    </div>
  );
}
