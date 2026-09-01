"use client";

import { useState } from "react";

export function ReportDialog({
  suspectId,
  orderId,
  messageId,
  onClose,
}: {
  suspectId?: string;
  orderId?: string;
  messageId?: string;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspectId, orderId, messageId, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yuborilmadi");
      setDone(true);
      setTimeout(onClose, 1300);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl glass-strong p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <p className="text-sm text-emerald-400">
            Shikoyatingiz yuborildi. Administrator ko'rib chiqadi.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <h3 className="font-semibold text-white">
              {messageId ? "Xabar ustidan shikoyat" : "Shikoyat"}
            </h3>
            <p className="text-xs text-zinc-400">
              Nomaqbul xatti-harakatni batafsil yozing. Ma'lumot faqat
              administratorga boradi.
            </p>
            <textarea
              className="input"
              rows={5}
              minLength={10}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nima bo'ldi?"
            />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                disabled={busy}
              >
                Bekor
              </button>
              <button className="btn-primary" disabled={busy}>
                {busy ? "..." : "Yuborish"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function ReportButton({
  suspectId,
  orderId,
  label = "Shikoyat qilish",
  className = "btn-ghost",
}: {
  suspectId?: string;
  orderId?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        ⚠︎ {label}
      </button>
      {open && (
        <ReportDialog
          suspectId={suspectId}
          orderId={orderId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
