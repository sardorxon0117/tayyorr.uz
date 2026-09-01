"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK = [20000, 50000, 100000, 300000];

function formatCard(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function WalletTopUp({ myCode }: { myCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(myCode);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletCode: code.trim(),
          cardNumber: card,
          expiry,
          amount: Number(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "To'lov amalga oshmadi");
      setMsg({
        ok: true,
        text: data.self
          ? "To'lov qabul qilindi, balans yangilandi."
          : `To'lov qabul qilindi (${code.trim()} hisobiga).`,
      });
      setCard("");
      setExpiry("");
      setAmount("");
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Hisobni to'ldirish</h2>
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          DEMO REJIM
        </span>
      </div>
      <p className="-mt-2 text-xs text-zinc-500">
        Hozircha demo: haqiqiy pul yechilmaydi. Click integratsiyasi ulangach shu
        oyna Click to'lov oynasiga almashadi.
      </p>

      <div>
        <label className="label">Hisob kodi (kimning hisobiga)</label>
        <input
          className="input font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="TYR-XXXX"
        />
        <p className="mt-1 text-xs text-zinc-500">
          O'zingizniki: <span className="font-mono">{myCode}</span>
        </p>
      </div>

      <div>
        <label className="label">Karta raqami</label>
        <input
          className="input font-mono tracking-widest"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="8600 0000 0000 0000"
          value={card}
          onChange={(e) => setCard(formatCard(e.target.value))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amal qilish muddati</label>
          <input
            className="input font-mono tracking-widest"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="label">Summa (so'm)</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={1000}
            step={1000}
            placeholder="50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String(q))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            +{q.toLocaleString("ru-RU").replace(/,/g, " ")}
          </button>
        ))}
      </div>

      {msg && (
        <p
          className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}
        >
          {msg.text}
        </p>
      )}

      <button className="btn-primary" disabled={busy}>
        {busy ? "..." : "To'lash"}
      </button>
    </form>
  );
}
