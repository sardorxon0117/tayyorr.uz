"use client";

import { useEffect, useRef, useState } from "react";

export interface PhoneSlideData {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

function PhoneFrame({
  slides,
  activeIndex,
  className = "",
}: {
  slides: PhoneSlideData[];
  activeIndex: number;
  className?: string;
}) {
  return (
    <div
      className={`phone-float relative w-56 overflow-hidden rounded-[2.4rem] border-[7px] border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 sm:w-64 ${className}`}
      style={{ aspectRatio: "9 / 19.5" }}
    >
      <div className="absolute left-1/2 top-0 z-10 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-800" />
      {slides.map((slide, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.id}
          src={slide.imageUrl}
          alt={slide.title}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === activeIndex ? 1 : 0,
            transition: "opacity 0.6s linear",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Landingda "Ilovani yuklab olish"dan oldingi scroll-hikoya bo'limi:
 * desktopda telefon chapda sticky turadi, o'ngdagi matn scroll bilan
 * almashganda telefon rasmi ham navbatdagi slaydga chiziqli o'tadi;
 * mobil kenglikda telefon tepada turadi, matn esa pastda gorizontal
 * swipe-karusel bo'lib qoladi.
 */
const PIN_TOP = 112; // top-28

export function PhoneScrollShowcase({ slides }: { slides: PhoneSlideData[] }) {
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const phoneBoxRef = useRef<HTMLDivElement | null>(null);
  const [pin, setPin] = useState<{
    mode: "before" | "pinned" | "after";
    left: number;
    width: number;
    height: number;
  }>({ mode: "before", left: 0, width: 0, height: 0 });

  // `<main>`da overflow-hidden borligi sababli CSS position:sticky ishlamaydi
  // (overflow-hidden ota-element sticky'ni buzadi) — shuning uchun telefonni
  // scroll asosida o'zimiz position:fixed bilan "pin" qilamiz.
  useEffect(() => {
    function update() {
      const wrap = wrapRef.current;
      const box = phoneBoxRef.current;
      if (!wrap || !box) return;
      const rect = wrap.getBoundingClientRect();
      const boxH = box.offsetHeight || 0;
      if (rect.top > PIN_TOP) {
        setPin({ mode: "before", left: rect.left, width: rect.width, height: boxH });
      } else if (rect.bottom - boxH < PIN_TOP) {
        setPin({ mode: "after", left: rect.left, width: rect.width, height: boxH });
      } else {
        setPin({ mode: "pinned", left: rect.left, width: rect.width, height: boxH });
      }
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [slides.length]);

  useEffect(() => {
    const els = blockRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.idx);
          if (!Number.isNaN(idx)) setDesktopIndex(idx);
        });
      },
      { threshold: 0, rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [slides.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const c = scrollRef.current;
        if (!c) return;
        const mid = c.scrollLeft + c.clientWidth / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const center = el.offsetLeft + el.offsetWidth / 2;
          const dist = Math.abs(center - mid);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        });
        setMobileIndex(bestIdx);
      });
    }
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
      <div className="text-center lg:text-left">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
          Ilova ichida
        </div>
      </div>

      {/* ---------- desktop: pin qilingan telefon + vertikal scroll matn ---------- */}
      <div className="mt-8 hidden lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div ref={wrapRef} className="relative">
          <div
            ref={phoneBoxRef}
            className="flex h-[65vh] items-center justify-center"
            style={
              pin.mode === "pinned"
                ? { position: "fixed", top: PIN_TOP, left: pin.left, width: pin.width }
                : pin.mode === "after"
                  ? { position: "absolute", left: 0, right: 0, bottom: 0 }
                  : { position: "absolute", left: 0, right: 0, top: PIN_TOP }
            }
          >
            <PhoneFrame slides={slides} activeIndex={desktopIndex} />
          </div>
        </div>
        <div>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              ref={(el) => {
                blockRefs.current[i] = el;
              }}
              data-idx={i}
              className="flex min-h-[60vh] flex-col justify-center"
            >
              <h3 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {slide.title}
              </h3>
              <p className="mt-4 max-w-md whitespace-pre-line text-zinc-400">
                {slide.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- mobil: sticky telefon tepada + gorizontal swipe matn ---------- */}
      <div className="mt-8 lg:hidden">
        <div className="flex justify-center pb-6">
          <PhoneFrame slides={slides} activeIndex={mobileIndex} className="w-44" />
        </div>
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: "none" }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="lq-glass shrink-0 snap-center rounded-2xl p-6"
              style={{ width: "85vw" }}
            >
              <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                {slide.title}
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm text-zinc-400">
                {slide.subtitle}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((slide, i) => (
            <span
              key={slide.id}
              className={`h-1.5 rounded-full transition-all ${
                i === mobileIndex ? "w-5 bg-indigo-400" : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
