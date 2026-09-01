import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { AuroraBackground } from "@/components/aurora-background";
import { MobileNav } from "@/components/mobile-nav";
import { getRestriction, restrictionText } from "@/lib/restriction";

const NAV = [
  { href: "/dashboard", label: "Kabinet" },
  { href: "/orders", label: "Buyurtmalar" },
  { href: "/messages", label: "Xabarlar" },
  { href: "/wallet", label: "Hamyon" },
  { href: "/profile", label: "Profil" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.profileComplete) redirect("/onboarding");

  const u = session.user;
  const restriction = await getRestriction(u.id);

  return (
    <div className="relative min-h-screen">
      <AuroraBackground compact />

      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-white/12 bg-[#0b0b12]/90 px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-2xl sm:px-4">
          <MobileNav links={NAV} />
          <Link href="/dashboard" className="shrink-0 font-semibold tracking-tight">
            tayyorr<span className="text-indigo-400">.uz</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-1 text-sm sm:flex">
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
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-white/5">
              {u.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.image} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition hover:text-red-400">
                Chiqish
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        {restriction && (
          <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            {restrictionText(restriction)}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
