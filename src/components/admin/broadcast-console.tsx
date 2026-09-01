"use client";

import { useEffect, useRef, useState } from "react";

interface Item {
  id: string;
  body: string;
  sentCount: number;
  createdAt: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("uz", { dateStyle: "short", timeStyle: "short" });
}

export function BroadcastConsole({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const [balanceMin, setBalanceMin] = useState("");
  const [balanceMax, setBalanceMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  function filters() {
    return {
      role: role || undefined,
      balanceMin: balanceMin || undefined,
      balanceMax: balanceMax || undefined,
      registeredFrom: from || undefined,
      registeredTo: to || undefined,
    };
  }

  // filtr o'zgarganda hisob eskiradi
  useEffect(() => {
    setCount(null);
  }, [role, balanceMin, balanceMax, from, to]);

  async function preview() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "x", preview: true, ...filters() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCount(data.count);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    if (
      !window.confirm(
        count != null
          ? `${count} ta foydalanuvchiga yuborilsinmi?`
          : "Filtrga mos hammaga yuborilsinmi?",
      )
    )
      return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, ...filters() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((p) => [...p, data.broadcast]);
      setText("");
      setCount(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
      style={{ height: "calc(100vh - 12rem)" }}
    >
      {/* ---- filtr (yuqorida) ---- */}
      <div className="shrink-0 border-b border-white/10 bg-white/[0.03] p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Barcha rollar</option>
            <option value="ORDERER">Buyurtma beruvchilar</option>
            <option value="PREPARER">Tayyorlovchilar</option>
          </select>
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Balans dan"
            value={balanceMin}
            onChange={(e) => setBalanceMin(e.target.value)}
          />
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Balans gacha"
            value={balanceMax}
            onChange={(e) => setBalanceMax(e.target.value)}
          />
          <label className="flex flex-col text-[11px] text-zinc-500">
            Ro'yxatdan — dan
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-[11px] text-zinc-500">
            Ro'yxatdan — gacha
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={preview}
            className="btn-ghost self-end"
          >
            {count != null ? `${count} ta mos` : "Nechta?"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-600">
          Bo'sh maydonlar hisobga olinmaydi (hammasi).
        </p>
      </div>

      {/* ---- yuborilganlar (chat) ---- */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {items.length === 0 && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Hali ommaviy xabar yuborilmagan.
          </p>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-indigo-600 px-3.5 py-2 text-sm text-white">
              <div className="whitespace-pre-wrap break-words">{it.body}</div>
              <div className="mt-1 text-right text-[10px] text-indigo-200">
                {it.sentCount} ta · {fmt(it.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---- xabar kiritish (pastda) ---- */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {err && <p className="mb-1 text-xs text-red-400">{err}</p>}
        <form onSubmit={send} className="flex items-end gap-2">
          <textarea
            className="input max-h-32 min-h-[42px] resize-none"
            rows={1}
            placeholder="tayyorr.uz support nomidan xabar…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
          />
          <button
            className="btn-primary flex h-[42px] w-[42px] shrink-0 items-center justify-center !p-0 text-lg leading-none"
            disabled={busy || !text.trim()}
          >
            🚀
          </button>
        </form>
      </div>
    </div>
  );
}
