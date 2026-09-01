"use client";

import { useEffect, useState } from "react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function subscribe() {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID),
    });
  }
  const json = sub.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
  });
}

export function PushSetup() {
  const [state, setState] = useState<
    "loading" | "unsupported" | "default" | "granted" | "denied"
  >("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window) ||
      !VAPID
    ) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        const perm = Notification.permission;
        setState(perm as "default" | "granted" | "denied");
        if (perm === "granted") subscribe().catch(() => {});
      })
      .catch(() => setState("unsupported"));
  }, []);

  if (state !== "default") return null;

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setState(perm as "granted" | "denied");
      if (perm === "granted") await subscribe();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-3 text-sm text-indigo-100">
      <span>🔔 Yangi xabarlar haqida bildirishnoma olishni yoqasizmi?</span>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="btn-primary shrink-0"
      >
        {busy ? "..." : "Yoqish"}
      </button>
    </div>
  );
}
