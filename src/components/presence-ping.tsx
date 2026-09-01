"use client";

import { useEffect } from "react";

export function PresencePing() {
  useEffect(() => {
    const ping = () => {
      if (!document.hidden) {
        fetch("/api/me/ping", { method: "POST", keepalive: true }).catch(() => {});
      }
    };
    ping();
    const iv = setInterval(ping, 60_000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);
  return null;
}
