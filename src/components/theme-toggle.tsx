"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-provider";

type Mode = "light" | "dark";
const KEY = "tyr_theme";

function apply(mode: Mode) {
  document.documentElement.classList.toggle("light", mode === "light");
}

const OPTS: [Mode, string, string][] = [
  ["light", "☀️", "theme.light"],
  ["dark", "🌙", "theme.dark"],
];

/** Yorug'/qorong'i rejim tanlagichi. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      setMode(stored === "light" ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }, []);

  function pick(m: Mode) {
    setMode(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
    apply(m);
  }

  return (
    <div
      className={`flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 ${className}`}
    >
      {OPTS.map(([m, icon, key]) => (
        <button
          key={m}
          type="button"
          onClick={() => pick(m)}
          aria-pressed={mode === m}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition ${
            mode === m
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <span aria-hidden>{icon}</span>
          <span>{t(key)}</span>
        </button>
      ))}
    </div>
  );
}
