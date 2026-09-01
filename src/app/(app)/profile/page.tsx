import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const restriction = await getRestriction(session!.user.id);
  if (restriction) return <RestrictionNotice restriction={restriction} />;
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: {
      firstName: true,
      lastName: true,
      login: true,
      email: true,
      role: true,
      about: true,
      avatarUrl: true,
    },
  });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">
        Profil
      </h1>
      <p className="mb-5 text-sm text-zinc-500">
        @{user.login} ·{" "}
        {user.role === "PREPARER" ? "Tayyorlovchi" : "Buyurtma beruvchi"}
        {user.email ? ` · ${user.email}` : ""}
      </p>
      <ProfileForm
        initial={{
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          about: user.about ?? "",
          avatarUrl: user.avatarUrl ?? "",
        }}
      />
    </div>
  );
}
