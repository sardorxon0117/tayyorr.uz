import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuroraBackground } from "@/components/aurora-background";
import { AppHeader } from "@/components/app-header";
import { PushSetup } from "@/components/push-setup";
import { PresencePing } from "@/components/presence-ping";
import { NavHistoryTracker } from "@/components/nav-history";
import { RestrictionBanner } from "@/components/restriction-banner";
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
      <PresencePing />
      <NavHistoryTracker />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <PushSetup />
        {restriction && <RestrictionBanner text={restrictionText(restriction)} />}
        {children}
      </main>
    </div>
  );
}
