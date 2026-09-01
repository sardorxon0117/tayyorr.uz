"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupportMessageForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      setBody("");
      setMsg("Yuborildi (tayyorr.uz support)");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        className="input"
        rows={3}
        placeholder="tayyorr.uz support nomidan xabar..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />
      {msg && <p className="text-xs text-zinc-400">{msg}</p>}
      <button className="btn-primary w-fit" disabled={busy || !body.trim()}>
        {busy ? "..." : "Xabar yuborish"}
      </button>
    </form>
  );
}
