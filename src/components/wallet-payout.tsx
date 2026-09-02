"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function WalletPayout({ balance }: { balance: number }) {
  const router = useRouter();
  const [card, setCard] = useState("");
  const [cardName, setCardName] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/wallet/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          card,
          cardName: cardName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Amalga oshmadi");
      setMsg({
        ok: true,
        text: "Mablag' hisobdan yechildi va tez orada kartangizga o'tkaziladi.",
      });
      setCard("");
      setCardName("");
      setAmount("");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3">
      <h2 className="font-semibold text-white">Kartaga yechib olish</h2>
      <p className="-mt-1 text-xs text-zinc-500">
        Mablag' darhol hisobdan yechiladi va kartangizga o'tkaziladi.
        Mavjud: {balance.toLocaleString("ru-RU")} so'm.
      </p>
      <div>
        <label className="label">Karta raqami</label>
        <input
          className="input font-mono tracking-widest"
          inputMode="numeric"
          placeholder="8600 0000 0000 0000"
          value={card}
          onChange={(e) => setCard(formatCard(e.target.value))}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Karta egasi (ixtiyoriy)</label>
          <input
            className="input"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Summa (so'm)</label>
          <input
            className="input"
            type="number"
            min={10000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
      <button className="btn-primary w-fit" disabled={busy}>
        {busy ? "..." : "Yechib olish"}
      </button>
    </form>
  );
}
