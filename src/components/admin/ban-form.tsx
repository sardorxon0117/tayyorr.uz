"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { label: "1 kun", days: 1 },
  { label: "3 kun", days: 3 },
  { label: "7 kun", days: 7 },
  { label: "30 kun", days: 30 },
  { label: "Muddatsiz", days: 0 },
];

export function BanForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, reason, notify }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      setReason("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label className="label">Muddat</label>
        <select
          className="input"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {OPTIONS.map((o) => (
            <option key={o.days} value={o.days}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Sabab (foydalanuvchiga ko'rinadi)</label>
        <textarea
          className="input"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
        />
        «tayyorr.uz support» orqali xabar yuborilsin
      </label>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button className="btn-primary w-fit" disabled={busy}>
        {busy ? "..." : "Cheklash / ban"}
      </button>
    </form>
  );
}
