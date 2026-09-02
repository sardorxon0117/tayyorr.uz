"use client";

import { useRouter } from "next/navigation";

/** Oldingi sahifaga qaytaradi (masalan chat ichiga), aks holda fallback. */
export function BackLink({
  fallback = "/messages",
  label = "orqaga",
  className = "inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className={className}
    >
      ‹ {label}
    </button>
  );
}
