"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAR_PRICE = 2_000;
const QUICK = [5, 10, 25, 50];

export function WalletBuyStars({ starBalance }: { starBalance: number }) {
  const router = useRouter();
  const [stars, setStars] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(stars);
    if (!n || n <= 0) {
      setMsg({ ok: false, text: "Star sonini kiriting" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/wallet/buy-stars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      setMsg({ ok: true, text: `${n} ⭐ sotib olindi!` });
      setStars("");
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
        <h2 className="font-semibold text-white">⭐ Star</h2>
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          {starBalance} ⭐ mavjud
        </span>
      </div>
      <p className="-mt-2 text-xs text-zinc-500">
        Buyurtmaga ariza yuborish va navbatda yuqoriga chiqish uchun kerak
        bo'ladi. 1 ⭐ = {STAR_PRICE.toLocaleString("ru-RU")} so'm, hamyon
        balansingizdan yechiladi.
      </p>

      <div>
        <label className="label">Nechta star (dona)</label>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="10"
          value={stars}
          onChange={(e) => setStars(e.target.value)}
          required
        />
        {!!Number(stars) && (
          <p className="mt-1 text-xs text-zinc-500">
            Narxi: {(Number(stars) * STAR_PRICE).toLocaleString("ru-RU")} so'm
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setStars(String(q))}
            className="backdrop-blur-sm rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            {q} ⭐
          </button>
        ))}
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}

      <button className="btn-primary" disabled={busy}>
        {busy ? "..." : "Star sotib olish"}
      </button>
    </form>
  );
}
