import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { SupportMessageForm } from "@/components/admin/support-message-form";

export default async function AdminUserSupportMessage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, isSupport: true },
  });
  if (!user || user.isSupport) notFound();

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-3 font-semibold text-white">tayyorr.uz support xabari</h2>
      <SupportMessageForm userId={user.id} />
    </section>
  );
}
