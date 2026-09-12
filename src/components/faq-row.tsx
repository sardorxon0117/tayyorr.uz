"use client";

import { useState } from "react";

export function FaqRow({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-medium text-white"
      >
        {question}
        <span
          className={`shrink-0 text-lg leading-none text-indigo-400 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <div className={`faq-panel ${open ? "open" : ""}`}>
        <div className="faq-panel-inner">
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{answer}</p>
        </div>
      </div>
    </div>
  );
}
