"use client";

import { useEffect, useState } from "react";

/** Har bir "slayd" — diagramma va matn qatorlari uchun turli qiymatlar. */
const SLIDES: { bars: number[]; title: string; sub: string }[] = [
  { bars: [34, 58, 26, 78, 46], title: "72%", sub: "58%" },
  { bars: [62, 40, 82, 50, 30], title: "54%", sub: "80%" },
  { bars: [48, 72, 36, 26, 64], title: "88%", sub: "42%" },
];

const CYCLE_MS = 3200;

/**
 * Hero vizuali: orqada statik hujjat kartasi, oldda — doimiy animatsiyali
 * "prezentatsiya" kartasi (diagramma va matn qatorlari har bir siklda
 * silliq o'zgaradi + doimiy yorug'lik o'tishi).
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

      {/* oldda: prezentatsiya — doimiy animatsiyalanadi */}
      <div className="lq-glass-strong absolute right-0 top-0 w-72 overflow-hidden rounded-2xl p-6 shadow-2xl shadow-black/40 sm:w-80 lg:w-96">
        {/* doimiy sirpanuvchi yorug'lik */}
        <div className="hero-shimmer" aria-hidden />

        <div className="relative flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>

        <div className="relative mt-5 flex items-center justify-between">
          <div
            className="h-3 rounded-full bg-white/30 transition-all duration-700 ease-out"
            style={{ width: "45%" }}
          />
          <span className="font-display text-lg font-bold text-indigo-300 transition-all duration-500">
            {slide.title}
          </span>
        </div>
        <div
          className="relative mt-2.5 h-1.5 rounded-full bg-white/10 transition-all duration-700 ease-out"
          style={{ width: slide.sub }}
        />

        <div className="relative mt-7 flex h-24 items-end gap-2.5">
          {slide.bars.map((h, idx) => (
            <div
              key={idx}
              className="w-7 rounded-t-md bg-indigo-400 transition-all duration-700 ease-out"
              style={{ height: `${h}%`, opacity: 0.45 + (h / 100) * 0.55 }}
            />
          ))}
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
