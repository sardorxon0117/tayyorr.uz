"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

function apply(mode: Mode) {
  document.documentElement.classList.toggle("light", mode === "light");
  document.cookie = `tyr_theme=${mode}; path=/; max-age=31536000; samesite=lax`;
  fetch("/api/me/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme: mode }),
  }).catch(() => {});
}

const OPTS: [Mode, string, string][] = [
  ["light", "☀️", "Yorug'"],
  ["dark", "🌙", "Qorong'i"],
];

/** Yorug'/qorong'i rejim tanlagichi. */
export function ThemeToggle({
  className = "",
  bare = false,
}: {
  className?: string;
  bare?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    setMode(
      document.documentElement.classList.contains("light") ? "light" : "dark",
    );
  }, []);

  function pick(m: Mode) {
    setMode(m);
    apply(m);
  }

  return (
    <div
      className={`flex gap-1 ${
        bare ? "" : "rounded-xl border border-white/10 bg-white/5 p-1"
      } ${className}`}
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
