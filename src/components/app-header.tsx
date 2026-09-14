"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMenu } from "@/components/nav-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { navForRole } from "@/lib/nav";
import { useUnread } from "@/components/unread-provider";

export function AppHeader({
  image,
  unread = 0,
  starBalance = null,
  role = null,
}: {
  image: string | null;
  unread?: number;
  /** null bo'lsa (masalan buyurtma beruvchi) belgi umuman ko'rsatilmaydi. */
  starBalance?: number | null;
  role?: string | null;
}) {
  const pathname = usePathname();
  const live = useUnread();
  // chat ichida header ChatRoom bilan birlashadi — bu yerda ko'rsatmaymiz
  if (/^\/messages\/[^/]+$/.test(pathname)) return null;

  const unreadCount = live ? live.total : unread;
  const nav = navForRole(role).map((l) =>
    l.href === "/messages" ? { ...l, badge: unreadCount } : l,
  );

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 lg:hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-white/12 bg-[#0b0b12]/90 px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-2xl sm:px-4">
        <Link href="/dashboard" className="shrink-0">
          <Logo className="h-4 max-w-[70vw] sm:h-6" />
        </Link>
        <div className="ml-auto flex items-center gap-2.5">
          {starBalance !== null && (
            <Link
              href="/wallet"
              className="flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              aria-label="Star balansi"
            >
              {starBalance} ⭐
            </Link>
          )}
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
          <NavMenu links={nav} footer={<ThemeToggle bare />} />
        </div>
      </div>
    </header>
  );
}
