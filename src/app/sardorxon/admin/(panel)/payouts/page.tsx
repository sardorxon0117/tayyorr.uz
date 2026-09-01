import Link from "next/link";

import { db } from "@/lib/db";
import { formatSom } from "@/lib/wallet";
import { AdminPostButton } from "@/components/admin/admin-post-button";

const STATUS: Record<string, string> = {
  PENDING: "Kutilmoqda",
  PAID: "To'landi",
  REJECTED: "Rad etildi",
  CANCELLED: "Bekor qilindi",
};

function groupCard(d: string) {
  return d.replace(/(.{4})/g, "$1 ").trim();
}

export default async function AdminPayouts() {
  const rows = await db.payoutRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 150,
    include: { user: { select: { id: true, login: true, name: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">Kartaga yechib olish</h1>
      <p className="text-sm text-zinc-500">
        Kartaga qo'lda o'tkazгач «To'landi» ni bosing. «Rad etish» — mablag'
        foydalanuvchi hisobiga qaytadi.
      </p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-2">Sana</th>
              <th className="px-4 py-2">Foydalanuvchi</th>
              <th className="px-4 py-2">Karta</th>
              <th className="px-4 py-2">Egasi</th>
              <th className="px-4 py-2">Summa</th>
              <th className="px-4 py-2">Holat</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="whitespace-nowrap px-4 py-2 text-zinc-400">
                  {p.createdAt.toLocaleString("uz", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/sardorxon/admin/users/${p.user.id}`}
                    className="text-indigo-400 hover:underline"
                  >
                    @{p.user.login ?? p.user.name ?? "—"}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-zinc-200">
                  {groupCard(p.card)}
                </td>
                <td className="px-4 py-2 text-zinc-400">{p.cardName ?? "—"}</td>
                <td className="px-4 py-2 font-medium text-white">
                  {formatSom(p.amount)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      p.status === "PAID"
                        ? "text-emerald-400"
                        : p.status === "PENDING"
                          ? "text-amber-400"
                          : "text-zinc-500"
                    }
                  >
                    {STATUS[p.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {p.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <AdminPostButton
                        url={`/api/admin/payouts/${p.id}`}
                        body={{ action: "PAID" }}
                        label="To'landi"
                        className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25"
                        confirmText="Kartaga o'tkazildi deb belgilansinmi?"
                      />
                      <AdminPostButton
                        url={`/api/admin/payouts/${p.id}`}
                        body={{ action: "REJECT" }}
                        label="Rad etish"
                        className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/25"
                        confirmText="Rad etilib, mablag' qaytarilsinmi?"
                      />
                    </div>
                  )}
                  {p.adminNote && (
                    <div className="mt-1 text-xs text-zinc-500">{p.adminNote}</div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  So'rovlar yo'q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
