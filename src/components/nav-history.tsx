"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "tyr_nav";

/** Sayt ichidagi sahifa yo'lини kuzatib boradi — "orqaga" tugmasи uchun. */
export function NavHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stack: string[] = JSON.parse(sessionStorage.getItem(KEY) || "[]");
      const last = stack[stack.length - 1];
      const prev = stack[stack.length - 2];

      if (last === pathname) return; // bir xil sahifa
      if (prev === pathname) {
        stack.pop(); // orqaga qaytildi
      } else {
        stack.push(pathname); // yangi sahifa
      }
      if (stack.length > 40) stack.splice(0, stack.length - 40);
      sessionStorage.setItem(KEY, JSON.stringify(stack));
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}

/** Sayt ichida oldingi sahifa bormi (orqaga qaytса bo'ladimi). */
export function canGoBack(): boolean {
  try {
    const stack: string[] = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    return stack.length > 1;
  } catch {
    return false;
  }
}
