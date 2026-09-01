"use client";

import { useState } from "react";

export function Stars({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-0.5 ${cls}`} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? "text-amber-400" : "text-zinc-600"}>
          {i <= rounded ? "★" : i - 0.5 === rounded ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1 text-3xl">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className={`transition ${i <= shown ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
          aria-label={`${i} yulduz`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
