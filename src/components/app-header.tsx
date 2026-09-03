"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMenu } from "@/components/nav-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { APP_NAV } from "@/lib/nav";

export function AppHeader({ image }: { image: string | null }) {
  const pathname = usePathname();
  // chat ichida header ChatRoom bilan birlashadi — bu yerda ko'rsatmaymiz
  if (/^\/messages\/[^/]+$/.test(pathname)) return null;

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 lg:hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-white/12 bg-[#0b0b12]/90 px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-2xl sm:px-4">
        <Link href="/dashboard" className="shrink-0">
          <Logo className="h-5 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href="/profile"
            className="h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-white/5 transition hover:border-white/30"
            aria-label="Profil"
          >
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            )}
          </Link>
          <NavMenu links={APP_NAV} footer={<ThemeToggle bare />} />
        </div>
      </div>
    </header>
  );
}
