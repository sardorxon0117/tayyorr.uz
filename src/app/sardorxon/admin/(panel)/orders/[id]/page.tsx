import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { formatSom } from "@/lib/wallet";
import { PRIVATE_BUCKET, presignGet } from "@/lib/r2";
import { AdminPostButton } from "@/components/admin/admin-post-button";

const TYPE: Record<string, string> = {
  PRESENTATION: "Prezentatsiya",
  COURSE_WORK: "Kurs ishi",
  REFERAT: "Referat",
  ESSAY: "Esse",
  DIPLOMA: "Diplom ishi",
  OTHER: "Boshqa",
};
const STATUS: Record<string, string> = {
  OPEN: "Ochiq",
  IN_PROGRESS: "Jarayonda",
  DELIVERED: "Topshirilgan",
  DONE: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
};

function u(x: { login: string | null; name: string | null } | null | undefined) {
  return x ? `@${x.login ?? x.name ?? "—"}` : "—";
}

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      orderer: { select: { id: true, login: true, name: true } },
      preparer: { select: { id: true, login: true, name: true } },
      files: true,
      review: true,
      offers: {
        orderBy: { createdAt: "asc" },
        include: { preparer: { select: { id: true, login: true, name: true } } },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        include: { preparer: { select: { id: true, login: true, name: true } } },
      },
    },
  });
  if (!order) notFound();

  const files = await Promise.all(
    order.files.map(async (f) => ({
      id: f.id,
      kind: f.kind,
      mimeType: f.mimeType,
      size: f.size,
      url:
        f.bucket === "private"
          ? await presignGet({ bucket: PRIVATE_BUCKET, key: f.key })
          : null,
    })),
  );

  const rows: [string, React.ReactNode][] = [
    ["ID", order.id],
    ["Holat", STATUS[order.status] ?? order.status],
    ["Turi", TYPE[order.type] ?? order.type],
    ["Byudjet", order.budget ? formatSom(order.budget) : "—"],
    [
      "Muddat",
      order.deadline ? order.deadline.toLocaleDateString("uz") : "—",
    ],
    [
      "Buyurtmachi",
      <Link
        key="o"
        href={`/sardorxon/admin/users/${order.orderer.id}`}
        className="text-indigo-400 hover:underline"
      >
        {u(order.orderer)}
      </Link>,
    ],
    [
      "Tayyorlovchi",
      order.preparer ? (
        <Link
          key="p"
          href={`/sardorxon/admin/users/${order.preparer.id}`}
          className="text-indigo-400 hover:underline"
        >
          {u(order.preparer)}
        </Link>
      ) : (
        "—"
      ),
    ],
    ["Yaratilgan", order.createdAt.toLocaleString("uz")],
    ["Yangilangan", order.updatedAt.toLocaleString("uz")],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/sardorxon/admin/orders"
        className="text-sm text-zinc-500 hover:text-white"
      >
        ← Buyurtmalar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">{order.title}</h1>
        <AdminPostButton
          url={`/api/admin/orders/${order.id}`}
          method="DELETE"
          label="O'chirish"
          className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/25"
          confirmText="Buyurtma butunlay o'chiriladi (takliflar, shartnomalar, fayllar). Faol shartnomadagi mablag' buyurtmachiga qaytariladi. Davom etilsinmi?"
          redirectTo="/sardorxon/admin/orders"
        />
      </div>

      <div className="rounded-xl border border-white/10">
        <dl className="divide-y divide-white/5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-2">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="text-right text-zinc-200">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-white">Tavsif</h2>
        <div className="whitespace-pre-wrap rounded-xl border border-white/10 p-4 text-sm text-zinc-300">
          {order.description}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-white">
          Fayllar ({files.length})
        </h2>
        {files.length === 0 ? (
          <p className="text-sm text-zinc-600">Fayl yo'q.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {files.map((f) => (
              <li key={f.id}>
                {f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    {f.kind} · {f.mimeType} · {(f.size / 1024).toFixed(0)} KB
                  </a>
                ) : (
                  <span className="text-zinc-500">
                    {f.kind} · {f.mimeType}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-white">
          Takliflar ({order.offers.length})
        </h2>
        {order.offers.length === 0 ? (
          <p className="text-sm text-zinc-600">Taklif yo'q.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {order.offers.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-white/10 p-3 text-sm"
              >
                <div className="flex justify-between gap-3">
                  <Link
                    href={`/sardorxon/admin/users/${o.preparer.id}`}
                    className="text-indigo-400 hover:underline"
                  >
                    {u(o.preparer)}
                  </Link>
                  <span className="text-zinc-300">
                    {formatSom(o.price)} · {o.status}
                  </span>
                </div>
                {o.message && (
                  <p className="mt-1 text-zinc-400">{o.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-white">
          Shartnomalar ({order.contracts.length})
        </h2>
        {order.contracts.length === 0 ? (
          <p className="text-sm text-zinc-600">Shartnoma yo'q.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {order.contracts.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-white/10 p-3 text-sm"
              >
                <div className="flex justify-between gap-3">
                  <Link
                    href={`/sardorxon/admin/users/${c.preparer.id}`}
                    className="text-indigo-400 hover:underline"
                  >
                    {u(c.preparer)}
                  </Link>
                  <span className="text-zinc-300">
                    {formatSom(c.amount)} · {c.status}
                  </span>
                </div>
                {c.note && <p className="mt-1 text-zinc-400">{c.note}</p>}
                <div className="mt-1 text-xs text-zinc-600">
                  {c.createdAt.toLocaleString("uz")}
                  {c.commissionAmount
                    ? ` · komissiya ${formatSom(c.commissionAmount)}`
                    : ""}
                  {c.payoutAmount ? ` · to'lov ${formatSom(c.payoutAmount)}` : ""}
                  {c.refundAmount ? ` · qaytdi ${formatSom(c.refundAmount)}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {order.review && (
        <div>
          <h2 className="mb-2 font-semibold text-white">Baho</h2>
          <div className="rounded-xl border border-white/10 p-3 text-sm text-zinc-300">
            {"★".repeat(order.review.stars)}
            {"☆".repeat(5 - order.review.stars)} ({order.review.stars}/5)
            {order.review.comment && (
              <p className="mt-1 text-zinc-400">«{order.review.comment}»</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
