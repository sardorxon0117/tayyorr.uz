import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { AdminPostButton } from "@/components/admin/admin-post-button";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#08080d] text-zinc-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-6 py-3">
          <Link href="/sardorxon/admin" className="font-semibold">
            tayyorr<span className="text-indigo-400">.uz</span>{" "}
            <span className="text-zinc-500">admin</span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm">
            <Tab href="/sardorxon/admin">Bosh</Tab>
            <Tab href="/sardorxon/admin/messages">Xabarlar</Tab>
            <Tab href="/sardorxon/admin/payments">To'lovlar</Tab>
            <Tab href="/sardorxon/admin/complaints">Shikoyatlar</Tab>
            <Tab href="/sardorxon/admin/users">Foydalanuvchilar</Tab>
            <Tab href="/sardorxon/admin/chats">Suhbatlar</Tab>
          </nav>
          <AdminPostButton
            url="/api/admin/logout"
            label="Chiqish"
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition hover:text-red-400"
            redirectTo="/sardorxon/admin/login"
          />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

function Tab({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
    >
      {children}
    </Link>
  );
}
