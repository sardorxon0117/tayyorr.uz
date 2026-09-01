"use client";

import { usePathname } from "next/navigation";

export function RestrictionBanner({ text }: { text: string }) {
  const pathname = usePathname();
  // chat ichida ko'rsatmaymiz — yubormoqchi bo'lganda baribir eslatiladi
  if (/^\/messages\/[^/]+$/.test(pathname)) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
      {text}
    </div>
  );
}
