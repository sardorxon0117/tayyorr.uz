"use client";

import { useState } from "react";

const QUICK = [20000, 50000, 100000, 300000];

export function WalletTopUp({ myCode }: { myCode: string }) {
  const [code, setCode] = useState(myCode);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/wallet/topup/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletCode: code.trim(),
          amount: Number(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "To'lov boshlanmadi");
      // Click to'lov sahifasiga o'tamiz
      window.location.href = data.payUrl;
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Xatolik" });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Hisobni to'ldirish</h2>
        <span className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
          Click orqali
        </span>
      </div>
      <p className="-mt-2 text-xs text-zinc-500">
        Summani kiriting — Click'ning xavfsiz to'lov sahifasiga
        yo'naltirilasiz. Karta ma'lumotlari saytimizda saqlanmaydi.
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

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String(q))}
            className="backdrop-blur-sm rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
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
        {busy ? "..." : "Click orqali to'lash"}
      </button>
    </form>
  );
}
