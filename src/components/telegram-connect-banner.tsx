"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "tyr_tg_banner_dismissed";

export function TelegramConnectBanner({
  connected,
  connectUrl,
}: {
  connected: boolean;
  connectUrl: string;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (connected || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-400/25 bg-sky-500/10 p-3 text-sm text-sky-100">
      <span>
        ✈️ Endi bildirishnomalarni Telegram orqali ham olishingiz mumkin —
        botga ulaning.
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={connectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Bog&apos;lanish
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg px-2 py-1 text-sky-300/70 transition hover:text-sky-100"
          aria-label="Yopish"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
