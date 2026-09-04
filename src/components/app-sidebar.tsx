"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAV } from "@/lib/nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BalanceAmount } from "@/components/balance-amount";
import { useLocale } from "@/components/locale-provider";
import { useUnread } from "@/components/unread-provider";

export interface SidebarUser {
  name: string | null;
  login: string | null;
  role: string | null;
  image: string | null;
  balance: number;
  walletCode: string | null;
}

/** Kompyuterda chap tomonda turadigan doimiy panel (headerni almashtiradi). */
export function AppSidebar({
  user,
  unread = 0,
}: {
  user: SidebarUser;
  unread?: number;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const live = useUnread();
  const unreadCount = live ? live.total : unread;
  const nav = APP_NAV.map((l) =>
    l.href === "/messages" ? { ...l, badge: unreadCount } : l,
  );
  const displayName =
    user.name || (user.login ? `@${user.login}` : "Foydalanuvchi");
  const roleLabel =
    user.role === "PREPARER"
      ? t("role.preparer")
      : user.role === "ORDERER"
        ? t("role.orderer")
        : "";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/10 bg-[#0b0b12]/95 backdrop-blur-xl lg:flex">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <Link href="/dashboard" className="px-1">
          <Logo className="h-6" />
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:bg-white/[0.06]"
        >
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">
              {displayName}
            </span>
            <span className="block truncate text-xs text-zinc-500">
              {roleLabel}
            </span>
          </span>
        </Link>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] text-zinc-500">
            {t("wallet.balanceLabel")}
          </div>
          <BalanceAmount
            value={user.balance}
            className="mt-0.5 text-lg font-semibold text-white"
          />
          {user.walletCode && (
            <div className="mt-0.5 text-[10px] text-zinc-600">
              kod:{" "}
              <span className="font-mono text-zinc-400">{user.walletCode}</span>
            </div>
          )}
          <Link
            href="/wallet"
            className="mt-2 block text-xs text-indigo-300 hover:underline"
          >
            {t("wallet.topup")} →
          </Link>
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-indigo-500/15 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{l.icon}</span>
                <span className="flex-1">{l.tkey ? t(l.tkey) : l.label}</span>
                {!!l.badge && l.badge > 0 && (
                  <span className="rounded-full bg-indigo-500 px-1.5 text-xs font-semibold text-white">
                    {l.badge > 99 ? "99+" : l.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
