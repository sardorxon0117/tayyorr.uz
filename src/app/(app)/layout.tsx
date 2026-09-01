import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuroraBackground } from "@/components/aurora-background";
import { AppHeader } from "@/components/app-header";
import { getRestriction, restrictionText } from "@/lib/restriction";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.profileComplete) redirect("/onboarding");

  const restriction = await getRestriction(session.user.id);

  return (
    <div className="relative min-h-screen">
      <AuroraBackground compact />

      <AppHeader image={session.user.image ?? null} />

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
