import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getConversationForUser, otherUserId } from "@/lib/chat";
import { toClientMessages } from "@/lib/chat-messages";
import { ChatRoom } from "@/components/chat-room";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const me = session!.user.id;

  const conv = await getConversationForUser(id, me);
  if (!conv) notFound();

  const [other, messages] = await Promise.all([
    db.user.findUnique({
      where: { id: otherUserId(conv, me) },
      select: {
        id: true,
        name: true,
        login: true,
        avatarUrl: true,
        image: true,
        isSupport: true,
      },
    }),
    db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
  ]);

  return (
    <ChatRoom
      conversationId={id}
      meId={me}
      orderId={conv.orderId}
      other={{
        id: other?.id ?? "",
        name: other?.name ?? other?.login ?? "Foydalanuvchi",
        login: other?.login ?? null,
        image: other?.avatarUrl ?? other?.image ?? null,
        isSupport: other?.isSupport ?? false,
      }}
      initialMessages={await toClientMessages(messages, me)}
    />
  );
}
