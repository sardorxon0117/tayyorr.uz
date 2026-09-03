"use client";

import { useEffect } from "react";

/** Yangi qurilmada cookie bo'lmasa — DB'даги mavzuni qo'llaydi. */
export function ThemeSync({ serverTheme }: { serverTheme: string | null }) {
  useEffect(() => {
    if (serverTheme !== "light" && serverTheme !== "dark") return;
    if (document.cookie.includes("tyr_theme=")) return; // cookie ustuvor

    const cur = document.documentElement.classList.contains("light")
      ? "light"
      : "dark";
    document.cookie = `tyr_theme=${serverTheme}; path=/; max-age=31536000; samesite=lax`;
    if (serverTheme !== cur) {
      document.documentElement.classList.toggle(
        "light",
        serverTheme === "light",
      );
    }
  }, [serverTheme]);
  return null;
}
