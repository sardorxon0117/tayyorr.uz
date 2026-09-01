"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminPostButton({
  url,
  body,
  label,
  confirmText,
  className = "btn-ghost",
  redirectTo,
}: {
  url: string;
  body?: unknown;
  label: string;
  confirmText?: string;
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Xatolik");
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" className={className} disabled={busy} onClick={run}>
        {busy ? "..." : label}
      </button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </span>
  );
}
