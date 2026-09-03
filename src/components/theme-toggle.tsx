"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";
const KEY = "tyr_theme";

function isLight(mode: Mode) {
  return (
    mode === "light" ||
    (mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: light)").matches)
  );
}

function apply(mode: Mode) {
  document.documentElement.classList.toggle("light", isLight(mode));
}

const OPTS: [Mode, string, string][] = [
  ["light", "☀️", "Yorug'"],
  ["dark", "🌙", "Qorong'i"],
  ["system", "🖥️", "Tizim"],
];

/** Yorug'/qorong'i rejim tanlagichi. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    let stored: Mode = "dark";
    try {
      stored = (localStorage.getItem(KEY) as Mode) || "dark";
    } catch {
      /* ignore */
    }
    setMode(stored);
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      try {
        if ((localStorage.getItem(KEY) as Mode) === "system") apply("system");
      } catch {
        /* ignore */
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
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
      {OPTS.map(([m, icon, label]) => (
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
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
