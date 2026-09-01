import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { formatSom } from "@/lib/wallet";
import { AdminPostButton } from "@/components/admin/admin-post-button";

export default async function AdminPaymentReceipt({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await db.walletTransaction.findUnique({
    where: { id },
    include: { user: { select: { id: true, login: true, name: true, balance: true } } },
  });
  if (!t) notFound();

  const meta = (t.meta ?? {}) as Record<string, unknown>;

  const rows: [string, string][] = [
    ["Amal ID", t.id],
    ["Sana", t.createdAt.toLocaleString("uz")],
    ["Foydalanuvchi", `@${t.user.login ?? t.user.name ?? t.user.id}`],
    ["Tur", t.type],
    ["Summa", formatSom(t.amount)],
    ["Usul", t.method],
    ["Holat", t.reversedAt ? "BEKOR QILINGAN" : t.status],
    ["Izoh", t.note ?? "—"],
    ["Karta", typeof meta.card === "string" ? meta.card : "—"],
    ["Demo", meta.demo ? "ha" : "yo'q"],
    ["Bekor qilingan", t.reversedAt ? t.reversedAt.toLocaleString("uz") : "—"],
    ["Foydalanuvchi joriy balansi", formatSom(t.user.balance)],
  ];

  const canReverse = !t.reversedAt && t.status === "SUCCESS";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <Link
        href="/sardorxon/admin/payments"
        className="text-sm text-zinc-500 hover:text-white"
      >
        ← To'lovlar
      </Link>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-lg font-semibold text-white">Chek</h1>
        <dl className="mt-4 divide-y divide-white/5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="text-right font-mono text-zinc-200">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {canReverse ? (
        <AdminPostButton
          url={`/api/admin/payments/${t.id}/reverse`}
          label="Amalni bekor qilish"
          className="btn-primary w-fit"
          confirmText="Bu amal bekor qilinadi va balans qayta hisoblanadi. Davom etilsinmi?"
        />
      ) : (
        <p className="text-sm text-zinc-500">
          Bu amalni bekor qilib bo'lmaydi.
        </p>
      )}
    </div>
  );
}
