"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

const SORTS = [
  { key: "new", label: "Yangi" },
  { key: "old", label: "Eski" },
  { key: "offers", label: "Takliflar" },
  { key: "budget", label: "Byudjet" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

import { timeAgo } from "@/lib/time-ago";
import { useDismiss } from "@/components/use-dismiss";

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

const OFFER_BUCKETS: { key: string; label: string; test: (n: number) => boolean }[] =
  [
    { key: "lt5", label: "5 tadan kam", test: (n) => n < 5 },
    { key: "5-10", label: "5 – 10 ta", test: (n) => n >= 5 && n <= 10 },
    { key: "10-50", label: "10 – 50 ta", test: (n) => n > 10 && n <= 50 },
    { key: "gt50", label: "50 tadan ko'p", test: (n) => n > 50 },
  ];

export interface OrderRow {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  budget: number | null;
  offers: number;
  createdAt: string;
  ordererLabel: string | null;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-indigo-400 bg-indigo-500/20 text-white"
          : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function OrdersBrowser({
  orders,
  title,
  newOrderHref,
  banner,
}: {
  orders: OrderRow[];
  title?: string;
  newOrderHref?: string;
  banner?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [buckets, setBuckets] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("new");
  const sheetRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), [sheetRef]);

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const activeCount = types.size + buckets.size;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = orders.filter((o) => {
      if (types.size && !types.has(o.type)) return false;
      if (buckets.size) {
        const ok = OFFER_BUCKETS.some(
          (b) => buckets.has(b.key) && b.test(o.offers),
        );
        if (!ok) return false;
      }
      if (needle) {
        const hay = `${o.title} ${o.description} ${
          TYPE_LABEL[o.type] ?? o.type
        }`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const by: Record<SortKey, (a: OrderRow, b: OrderRow) => number> = {
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      old: (a, b) => a.createdAt.localeCompare(b.createdAt),
      offers: (a, b) => b.offers - a.offers,
      budget: (a, b) => (b.budget ?? 0) - (a.budget ?? 0),
    };
    return [...list].sort(by[sort]);
  }, [orders, q, types, buckets, sort]);

  return (
    <div className="flex flex-col gap-3">
      {banner}
      <div className="sticky top-[4.25rem] z-20 flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0b0b12]/25 px-3 py-3 backdrop-blur-2xl sm:top-[4.75rem] lg:top-2">
        {(title || newOrderHref) && (
          <div className="flex items-center justify-between gap-2">
            {title && (
              <h1 className="text-lg font-semibold tracking-tight text-white">
                {title}
              </h1>
            )}
            {newOrderHref && (
              <Link href={newOrderHref} className="btn-primary shrink-0 text-sm">
                + Yangi buyurtma
              </Link>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input min-w-0 flex-1"
            placeholder="Sarlavha, tavsif yoki tur bo'yicha qidirish…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-ghost shrink-0"
          >
            Filtr{activeCount > 0 && ` · ${activeCount}`}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                sort === s.key
                  ? "bg-indigo-500/20 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-zinc-600">
            {filtered.length} ta
          </span>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...types].map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300"
            >
              {TYPE_LABEL[t] ?? t}
              <button
                type="button"
                onClick={() => setTypes((s) => toggle(s, t))}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
          {[...buckets].map((b) => (
            <span
              key={b}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300"
            >
              {OFFER_BUCKETS.find((x) => x.key === b)?.label ?? b}
              <button
                type="button"
                onClick={() => setBuckets((s) => toggle(s, b))}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setTypes(new Set());
              setBuckets(new Set());
            }}
            className="rounded-full px-2.5 py-1 text-xs text-zinc-500 hover:text-white"
          >
            Tozalash
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card text-sm text-zinc-500">
          {orders.length === 0
            ? "Hali buyurtma yo'q."
            : "Mos buyurtma topilmadi."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((o) => (
            <li key={o.id} className="blur-in">
              <Link
                href={`/orders/${o.id}`}
                className="card flex items-center justify-between gap-4 transition hover:border-white/15 hover:bg-white/[0.06]"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{o.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {TYPE_LABEL[o.type] ?? o.type} · {STATUS_LABEL[o.status] ?? o.status}
                    {o.ordererLabel && ` · @${o.ordererLabel}`}
                    {o.budget ? ` · ${o.budget.toLocaleString()} so'm` : ""}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-600">
                    {timeAgo(o.createdAt)} · {o.offers} taklif
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  {o.offers} taklif
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            ref={sheetRef}
            className="blur-in w-full max-w-md overflow-hidden rounded-t-2xl border border-white/10 bg-[#14141b] shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Filtr</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Ishning turi
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_LABEL).map(([key, label]) => (
                    <Chip
                      key={key}
                      active={types.has(key)}
                      onClick={() => setTypes((s) => toggle(s, key))}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Topshirganlar soni
                </div>
                <div className="flex flex-wrap gap-2">
                  {OFFER_BUCKETS.map((b) => (
                    <Chip
                      key={b.key}
                      active={buckets.has(b.key)}
                      onClick={() => setBuckets((s) => toggle(s, b.key))}
                    >
                      {b.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setTypes(new Set());
                  setBuckets(new Set());
                }}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Hammasini tozalash
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-primary"
              >
                Ko'rsatish ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
