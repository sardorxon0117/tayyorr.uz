import type { Message } from "@prisma/client";

import { db } from "@/lib/db";
import { publishToConversation } from "@/lib/chat-bus";
import { toSerializedMessage } from "@/lib/chat-messages";
import { sendTelegramToUser, siteUrl } from "@/lib/telegram-notify";
import { logToGroup } from "@/lib/telegram-log";
import { SUPPORT_NAME, getSupportUserId } from "@/lib/support";

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

  await sendTelegramToUser(recipientId, {
    title,
    body: snippet(m),
    url: siteUrl(`/messages/${m.conversationId}`),
    buttonLabel: "Xabarni ko'rish",
  });

  // foydalanuvchi support'ga yozgan bo'lsa — admin loglar guruhiga ham tushadi
  const supportId = await getSupportUserId();
  if (recipientId === supportId && !sender?.isSupport) {
    await logToGroup(
      "support",
      `💬 ${title}`,
      [snippet(m)],
      siteUrl(`/sardorxon/admin/chats/${m.conversationId}`),
    );
  }
}
