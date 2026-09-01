import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { AuroraBackground } from "@/components/aurora-background";
import { getRestriction, restrictionText } from "@/lib/restriction";

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

      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl glass px-4 py-2.5">
          <Link href="/dashboard" className="shrink-0 font-semibold tracking-tight">
            tayyorr<span className="text-indigo-400">.uz</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <NavLink href="/dashboard">Kabinet</NavLink>
            <NavLink href="/orders">Buyurtmalar</NavLink>
            <NavLink href="/messages">Xabarlar</NavLink>
            <NavLink href="/wallet">Hamyon</NavLink>
            <NavLink href="/profile">Profil</NavLink>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
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
              <button className="rounded-lg px-2 py-1 text-zinc-500 transition hover:text-red-400">
                Chiqish
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
    >
      {children}
    </Link>
  );
}
