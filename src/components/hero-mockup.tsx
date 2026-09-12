"use client";

import { useEffect, useState } from "react";

type Slide =
  | { kind: "bars"; bars: number[] }
  | { kind: "donut"; pct: number }
  | { kind: "image" };

/** Prezentatsiya slaydlari — turli ko'rinishlar orasida aylanadi. */
const SLIDES: Slide[] = [
  { kind: "bars", bars: [34, 58, 26, 78, 46] },
  { kind: "donut", pct: 64 },
  { kind: "image" },
];

const CYCLE_MS = 3200;

/**
 * Hero vizuali: orqada statik hujjat kartasi, oldda — doimiy animatsiyali
 * "prezentatsiya" kartasi. Karta fonini deyarli tiniq qilmadik — orqadagi
 * karta ko'rinib qolmasligi uchun.
 */
export function HeroMockup() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % SLIDES.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[i];

  return (
    <div className="relative mx-auto h-80 w-full max-w-sm sm:h-[26rem] lg:mx-0 lg:h-[28rem] lg:max-w-none">
      {/* orqada: referat / kurs ishi hujjati */}
      <div className="lq-glass animate-float-a absolute left-0 top-14 w-64 -rotate-6 rounded-2xl p-5 sm:w-72 lg:top-20 lg:w-80">
        <div className="h-2 w-14 rounded-full bg-white/25" />
        <div className="mt-4 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-white/10" />
          <div className="h-1.5 w-5/6 rounded-full bg-white/10" />
          <div className="h-1.5 w-full rounded-full bg-white/10" />
          <div className="h-1.5 w-2/3 rounded-full bg-white/10" />
        </div>
        <span className="mt-5 inline-block rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
          Referat / Kurs ishi
        </span>
      </div>

      {/* oldda: prezentatsiya — deyarli tiniq bo'lmagan (orqasi ko'rinmasin), doimiy animatsiyalanadi */}
      <div className="absolute right-0 top-0 w-72 rotate-3 overflow-hidden rounded-2xl border border-white/12 bg-[#0c0c13]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:w-80 lg:w-96">
        {/* doimiy sirpanuvchi yorug'lik */}
        <div className="hero-shimmer" aria-hidden />

        <div className="relative flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>

        <div className="relative mt-5 h-3 w-2/3 rounded-full bg-white/30" />
        <div className="relative mt-2.5 h-1.5 w-2/5 rounded-full bg-white/10" />

        <div className="relative mt-7 flex h-28 items-center justify-center">
          {slide.kind === "bars" && (
            <div className="flex h-full w-full items-end gap-2.5">
              {slide.bars.map((h, idx) => (
                <div
                  key={idx}
                  className="w-7 rounded-t-md bg-indigo-400 transition-all duration-700 ease-out"
                  style={{ height: `${h}%`, opacity: 0.45 + (h / 100) * 0.55 }}
                />
              ))}
            </div>
          )}

          {slide.kind === "donut" && (
            <div
              className="relative h-28 w-28 shrink-0 rounded-full transition-[background] duration-700 ease-out"
              style={{
                background: `conic-gradient(#818cf8 ${slide.pct}%, rgba(255,255,255,0.1) ${slide.pct}% 100%)`,
              }}
            >
              <div className="absolute inset-[16%] rounded-full bg-[#0c0c13]" />
            </div>
          )}

          {slide.kind === "image" && (
            <div className="flex w-full items-center gap-4">
              <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <IconImage className="h-8 w-8 text-indigo-300" />
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="h-1.5 w-full rounded-full bg-white/15" />
                <div className="h-1.5 w-4/5 rounded-full bg-white/10" />
                <div className="h-1.5 w-3/5 rounded-full bg-white/10" />
              </div>
            </div>
          )}
        </div>

        <div className="relative mt-6 flex items-center justify-between">
          <span className="inline-block rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-200">
            Prezentatsiya
          </span>
          <div className="flex gap-1.5">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === i ? "w-4 bg-indigo-400" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5-9 9" />
    </svg>
  );
}
