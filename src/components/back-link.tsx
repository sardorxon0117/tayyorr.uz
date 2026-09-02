"use client";

import { useRouter } from "next/navigation";

import { canGoBack } from "@/components/nav-history";

/** Foydalanuvchi qaysi sahifadan kelgan bo'lsa — o'sha yerga qaytaradi. */
export function BackLink({
  fallback = "/dashboard",
  label = "orqaga",
  className = "inline-flex w-fit items-center gap-1 text-sm text-zinc-500 hover:text-white",
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
        if (canGoBack()) router.back();
        else router.push(fallback);
      }}
      className={className}
    >
      ‹ {label}
    </button>
  );
}
