import Link from "next/link";

import { db } from "@/lib/db";
import { formatSom } from "@/lib/wallet";

export default async function AdminHome() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [users, openComplaints, txnToday, balanceAgg, banned] = await Promise.all([
    db.user.count({ where: { isSupport: false } }),
    db.complaint.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    db.walletTransaction.count({ where: { createdAt: { gte: since } } }),
    db.user.aggregate({ _sum: { balance: true } }),
    db.user.count({ where: { bannedUntil: { gt: new Date() } } }),
  ]);

  const cards = [
    { label: "Foydalanuvchilar", value: users, href: "/sardorxon/admin/users" },
    {
      label: "Ochiq shikoyatlar",
      value: openComplaints,
      href: "/sardorxon/admin/complaints",
    },
    { label: "24 soatlik amallar", value: txnToday, href: "/sardorxon/admin/payments" },
    { label: "Cheklangan hisoblar", value: banned, href: "/sardorxon/admin/users" },
    {
      label: "Umumiy balans",
      value: formatSom(balanceAgg._sum.balance ?? 0),
      href: "/sardorxon/admin/payments",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-white">Boshqaruv paneli</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
          >
            <div className="text-2xl font-semibold text-white">{c.value}</div>
            <div className="mt-1 text-sm text-zinc-500">{c.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
