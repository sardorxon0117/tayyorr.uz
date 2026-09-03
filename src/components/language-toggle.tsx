"use client";

import { useLocale } from "@/components/locale-provider";
import { LOCALES, LOCALE_SHORT } from "@/lib/i18n";

/** Til tanlagichi (UZ / RU / EN). */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div
      className={`flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 ${className}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
            locale === l
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {LOCALE_SHORT[l]}
        </button>
      ))}
    </div>
  );
}
