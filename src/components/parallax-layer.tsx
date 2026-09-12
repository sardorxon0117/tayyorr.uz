"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll qilinганда ichidagi elementni sekinroq/tezroq suradi — fon va
 * old plan orasida chuqurlik (depth) hissi beradi. `speed` musbat bo'lsa
 * pastga, manfiy bo'lsa yuqoriga qarab siljiydi.
 */
export function ParallaxLayer({
  speed = 0.12,
  className,
  style,
  children,
}: {
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    function apply() {
      const el = ref.current;
      if (el) {
        const y = window.scrollY * speed;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
      raf = 0;
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(apply);
    }
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
