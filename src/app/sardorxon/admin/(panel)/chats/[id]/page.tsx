import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { AdminPostButton } from "@/components/admin/admin-post-button";

export default async function AdminChatView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conv = await db.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, login: true, name: true, isSupport: true } },
      userB: { select: { id: true, login: true, name: true, isSupport: true } },
      order: { select: { id: true, title: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conv) notFound();

  const label = (u: {
    id: string;
    login: string | null;
    name: string | null;
    isSupport: boolean;
  }) => (u.isSupport ? "tayyorr.uz support" : `@${u.login ?? u.name ?? u.id}`);

  const nameOf = (senderId: string) =>
    senderId === conv.userA.id ? label(conv.userA) : label(conv.userB);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/sardorxon/admin/chats" className="text-sm text-zinc-500 hover:text-white">
        ← Suhbatlar
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {label(conv.userA)} ↔ {label(conv.userB)}
          </h1>
          <p className="text-sm text-zinc-500">
            <Link
              href={`/sardorxon/admin/users/${conv.userA.id}`}
              className="text-indigo-400 hover:underline"
            >
              {label(conv.userA)}
            </Link>{" "}
            ·{" "}
            <Link
              href={`/sardorxon/admin/users/${conv.userB.id}`}
              className="text-indigo-400 hover:underline"
            >
              {label(conv.userB)}
            </Link>
            {conv.order && ` · buyurtma: ${conv.order.title}`}
          </p>
        </div>
        <AdminPostButton
          url={`/api/admin/chats/${conv.id}/hide`}
          label={
            conv.hiddenFromUsersAt
              ? "Foydalanuvchilarga qaytarish"
              : "Foydalanuvchilardan yashirish"
          }
          className="btn-ghost"
        />
      </div>

      {conv.hiddenFromUsersAt && (
        <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Bu suhbat {conv.hiddenFromUsersAt.toLocaleString("uz")} da yashirilgan —
          foydalanuvchilar ko'rmaydi, lekin bazada saqlanmoqda.
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {conv.messages.length === 0 && (
          <p className="text-sm text-zinc-500">Xabarlar yo'q.</p>
        )}
        {conv.messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="text-zinc-500">
              [{m.createdAt.toLocaleString("uz", { dateStyle: "short", timeStyle: "short" })}]
            </span>{" "}
            <span className="font-medium text-white">{nameOf(m.senderId)}:</span>{" "}
            {m.fileKey && (
              <span className="text-indigo-300">📎 {m.fileName ?? "fayl"} </span>
            )}
            <span className="whitespace-pre-wrap text-zinc-200">{m.body}</span>
            {m.system && (
              <span className="ml-2 text-xs text-indigo-400">(tizim)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
