import type { Message } from "@prisma/client";

import { db } from "@/lib/db";
import { publishToConversation } from "@/lib/chat-bus";
import { toSerializedMessage } from "@/lib/chat-messages";
import { sendPushToUser } from "@/lib/push";
import { SUPPORT_NAME } from "@/lib/support";

function snippet(m: Message) {
  if (m.deletedAt) return "xabar";
  if (m.body) return m.body.length > 120 ? m.body.slice(0, 120) + "…" : m.body;
  if (m.fileName) return `📎 ${m.fileName}`;
  return "yangi xabar";
}

/**
 * Yangi xabar: real vaqt (SSE) + qabul qiluvchiga web-push bildirishnoma.
 */
export async function deliverMessage(m: Message) {
  publishToConversation(m.conversationId, {
    type: "message",
    message: await toSerializedMessage(m),
  });

  const conv = await db.conversation.findUnique({
    where: { id: m.conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!conv) return;

  const recipientId = conv.userAId === m.senderId ? conv.userBId : conv.userAId;
  if (!recipientId || recipientId === m.senderId) return;

  const sender = await db.user.findUnique({
    where: { id: m.senderId },
    select: { name: true, firstName: true, login: true, isSupport: true },
  });
  const title = sender?.isSupport
    ? SUPPORT_NAME
    : sender?.name ||
      sender?.firstName ||
      (sender?.login ? `@${sender.login}` : "Yangi xabar");

  await sendPushToUser(recipientId, {
    title,
    body: snippet(m),
    url: `/messages/${m.conversationId}`,
    tag: `conv-${m.conversationId}`,
  });
}
