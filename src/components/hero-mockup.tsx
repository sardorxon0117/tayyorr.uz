"use client";

import { useEffect, useRef, useState } from "react";

type Slide = {
  titleW: string;
  subW: string;
} & (
  | { kind: "bars"; bars: number[] }
  | { kind: "donut"; pct: number }
);

/** Prezentatsiya slaydlari — turli ko'rinishlar orasida aylanadi. */
const SLIDES: Slide[] = [
  { kind: "bars", bars: [34, 58, 26, 78, 46], titleW: "66%", subW: "38%" },
  { kind: "donut", pct: 64, titleW: "50%", subW: "70%" },
];

const CYCLE_MS = 3200;
const FADE_MS = 380;
const GROW_DELAY_MS = 90;

/**
 * Hero vizuali: orqada statik hujjat kartasi, oldda — doimiy animatsiyali
 * "prezentatsiya" kartasi. Slaydlar orasida blur bilan silliq o'tiladi,
 * har safar paydo bo'lganda ichidagi diagramma/matn qatorlari 0dan
 * o'sib chiqadi.
 */
export function HeroMockup() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [grow, setGrow] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t0 = setTimeout(() => setGrow(true), GROW_DELAY_MS);
    timers.current.push(t0);

    const cycle = setInterval(() => {
      setGrow(false);
      setPhase("out");
      const t1 = setTimeout(() => {
        setIdx((v) => (v + 1) % SLIDES.length);
        setPhase("in");
        const t2 = setTimeout(() => setGrow(true), GROW_DELAY_MS);
        timers.current.push(t2);
      }, FADE_MS);
      timers.current.push(t1);
    }, CYCLE_MS);

    return () => {
      clearInterval(cycle);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const slide = SLIDES[idx];

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
        {/* doimiy sirpanuvchi yorug'lik — chetlarda yumshoq so'nadi, to'satdan yo'qolmaydi */}
        <div className="hero-shimmer" aria-hidden />

        <div className="relative flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>

        {/* sarlavha "soyasi" — slayd almashganda kengligi ham o'zgarib, 0dan o'sadi */}
        <div
          className="relative mt-5 h-3 rounded-full bg-white/30 transition-all duration-700 ease-out"
          style={{ width: grow ? slide.titleW : "0%" }}
        />
        <div
          className="relative mt-2.5 h-1.5 rounded-full bg-white/10 transition-all duration-700 ease-out"
          style={{ width: grow ? slide.subW : "0%" }}
        />

        <div
          className={`hero-slide relative mt-7 flex h-28 items-center justify-center ${phase}`}
        >
          {slide.kind === "bars" && (
            <div className="flex h-full w-full items-end gap-2.5">
              {slide.bars.map((h, i) => (
                <div
                  key={i}
                  className="w-7 rounded-t-md bg-indigo-400 transition-all duration-700 ease-out"
                  style={{
                    height: grow ? `${h}%` : "0%",
                    opacity: 0.45 + (h / 100) * 0.55,
                  }}
                />
              ))}
            </div>
          )}

          {slide.kind === "donut" && <ProgressRing pct={slide.pct} grow={grow} />}
        </div>

        <div className="relative mt-6 flex items-center justify-between">
          <span className="inline-block rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-200">
            Prezentatsiya
          </span>
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === idx ? "w-4 bg-indigo-400" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Doiraviy diagramma — SVG halqa, uchlari dumaloq, 0dan foizgacha o'sib chiqadi. */
function ProgressRing({ pct, grow }: { pct: number; grow: boolean }) {
  const size = 112;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = grow ? pct : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#818cf8"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (filled / 100) * c}
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </svg>
  );
}
