"use client";

import { useRef } from "react";

/**
 * "Spatial UI" panel — sichqoncha harakatiga qarab yengil 3D burчак (tilt)
 * beradi, xuddi shisha panel fazoda muallaq turgandek. Faqat hover paytida
 * (pointer: fine) ishlaydi — mobilда oddiy tekis panel bo'lib qoladi.
 *
 * `className` — tashqi o'rovga (grid span, blur-in kabi kirish animatsiyasi
 * uchun) qo'llanadi. Uni tilt elementidan ALOHIDA ushlaymiz — chunki
 * bir xil elementda ikkita transform manbai (CSS animatsiya + tilt) bir-
 * birini bekor qilib qo'yardi.
 */
export function SpatialCard({
  children,
  className = "",
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div className={className}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="spatial-tilt h-full"
      >
        {children}
      </div>
    </div>
  );
}
