import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getSupportUserId } from "@/lib/support";
import { toClientMessages } from "@/lib/chat-messages";
import { AdminChatThread } from "@/components/admin/admin-chat-thread";

export default async function AdminMessageThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supportId = await getSupportUserId();

  const conv = await db.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, login: true, name: true, isSupport: true } },
      userB: { select: { id: true, login: true, name: true, isSupport: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 300 },
    },
  });
  if (!conv) notFound();
  if (conv.userAId !== supportId && conv.userBId !== supportId) notFound();

  const user = conv.userAId === supportId ? conv.userB : conv.userA;
  const initial = await toClientMessages(conv.messages, supportId, { forAdmin: true });

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/sardorxon/admin/messages"
        className="text-sm text-zinc-500 hover:text-white"
      >
        ← Xabarlar
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">
          {user.name ?? "—"}{" "}
          <span className="text-zinc-500">@{user.login ?? "—"}</span>
        </h1>
        <Link
          href={`/sardorxon/admin/users/${user.id}`}
          className="text-sm text-indigo-400 hover:underline"
        >
          Hisobni ochish →
        </Link>
      </div>

      <AdminChatThread conversationId={conv.id} initialMessages={initial} />
    </div>
  );
}
