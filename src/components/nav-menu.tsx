"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  href: string;
  label: string;
  icon: string;
}

/**
 * Barcha qurilmalarda: o'ng tarafdagi menyu tugmasi + animatsiyali panel.
 */
export function NavMenu({
  links,
  onSignOut,
}: {
  links: NavLink[];
  onSignOut?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const pathname = usePathname();

  function close() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 160);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label="Menyu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
      >
        <span className="relative flex h-3.5 w-4 flex-col justify-between">
          <span
            className={`h-0.5 w-full rounded bg-current transition-all duration-200 ${
              open ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-full rounded bg-current transition-all duration-200 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-full rounded bg-current transition-all duration-200 ${
              open ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <div
            className="menu-backdrop fixed inset-0 z-40 bg-black/50"
            onClick={close}
          />
          <div
            className={`menu-panel absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e16]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl ${
              closing ? "closing" : ""
            }`}
          >
            {links.map((l, i) => {
              const active =
                pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  style={{ ["--i" as string]: i }}
                  className={`menu-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-indigo-500/15 text-white"
                      : "text-zinc-300 hover:bg-white/5 hover:pl-4"
                  }`}
                >
                  <span className="text-base">{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}

            {onSignOut && (
              <>
                <div className="my-1 h-px bg-white/10" />
                <button
                  type="button"
                  style={{ ["--i" as string]: links.length }}
                  onClick={() => {
                    close();
                    onSignOut();
                  }}
                  className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:pl-4"
                >
                  <span className="text-base">⏻</span>
                  Chiqish
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
