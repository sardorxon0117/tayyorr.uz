import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { AdminPostButton } from "@/components/admin/admin-post-button";
import { MobileNav } from "@/components/mobile-nav";

const NAV = [
  { href: "/sardorxon/admin", label: "Bosh" },
  { href: "/sardorxon/admin/messages", label: "Xabarlar" },
  { href: "/sardorxon/admin/payments", label: "To'lovlar" },
  { href: "/sardorxon/admin/complaints", label: "Shikoyatlar" },
  { href: "/sardorxon/admin/users", label: "Foydalanuvchilar" },
  { href: "/sardorxon/admin/chats", label: "Suhbatlar" },
];

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#08080d] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08080d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <MobileNav links={NAV} />
          <Link href="/sardorxon/admin" className="shrink-0 font-semibold">
            tayyorr<span className="text-indigo-400">.uz</span>{" "}
            <span className="text-zinc-500">admin</span>
          </Link>
          <nav className="hidden flex-1 flex-wrap items-center gap-1 text-sm sm:flex">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <AdminPostButton
            url="/api/admin/logout"
            label="Chiqish"
            className="ml-auto rounded-lg px-2 py-1 text-sm text-zinc-500 transition hover:text-red-400 sm:ml-0"
            redirectTo="/sardorxon/admin/login"
          />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
