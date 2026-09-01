"use client";

import { useState } from "react";

export function BroadcastForm() {
  const [body, setBody] = useState("");
  const [role, setRole] = useState("");
  const [balanceMin, setBalanceMin] = useState("");
  const [balanceMax, setBalanceMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function payload(preview: boolean) {
    return {
      body,
      preview,
      role: role || undefined,
      balanceMin: balanceMin ? Number(balanceMin) : undefined,
      balanceMax: balanceMax ? Number(balanceMax) : undefined,
      registeredFrom: from || undefined,
      registeredTo: to || undefined,
    };
  }

  async function preview() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(true)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCount(data.count);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (
      !window.confirm(
        count != null
          ? `${count} ta foydalanuvchiga yuborilsinmi?`
          : "Filtrga mos hammaga yuborilsinmi?",
      )
    )
      return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(false)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ ok: true, text: `${data.sent} ta foydalanuvchiga yuborildi.` });
      setBody("");
      setCount(null);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="flex max-w-xl flex-col gap-4">
      <div>
        <label className="label">Xabar matni</label>
        <textarea
          className="input"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder="tayyorr.uz support nomidan yuboriladi"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 text-sm font-medium text-white">Filtrlar (ixtiyoriy)</div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Rol</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Hammasi</option>
              <option value="ORDERER">Buyurtma beruvchilar</option>
              <option value="PREPARER">Tayyorlovchilar</option>
            </select>
          </div>
          <div />
          <div>
            <label className="label">Balans dan (so'm)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={balanceMin}
              onChange={(e) => setBalanceMin(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Balans gacha (so'm)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={balanceMax}
              onChange={(e) => setBalanceMax(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ro'yxatdan — dan</label>
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ro'yxatdan — gacha</label>
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn-ghost mt-3"
          disabled={busy}
          onClick={preview}
        >
          Nechta foydalanuvchi?
        </button>
        {count != null && (
          <span className="ml-2 text-sm text-zinc-300">
            {count} ta mos keldi
          </span>
        )}
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}

      <button className="btn-primary w-fit" disabled={busy || !body.trim()}>
        {busy ? "..." : "Yuborish"}
      </button>
    </form>
  );
}
