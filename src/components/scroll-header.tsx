"use client";

import { useEffect, useState } from "react";

/**
 * Landing uchun suzuvchi header. Tepada (scroll = 0) shaffof, biroz pastga
 * surilgach glass fon + blur paydo bo'ladi.
 */
export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 sm:px-6">
      <nav
        className={`mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 transition-all duration-300 ${
          scrolled
            ? "nav-solid shadow-lg shadow-black/30"
            : "border border-transparent bg-transparent shadow-none"
        }`}
      >
        {children}
      </nav>
    </header>
  );
}
