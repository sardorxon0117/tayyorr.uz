import { db } from "@/lib/db";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { deliverMessage } from "@/lib/chat-notify";
import { getSupportUserId } from "@/lib/support";

/** tayyorr.uz support nomidan foydalanuvchiga xabar yuboradi (real vaqt + push). */
export async function sendSupportMessage(
  userId: string,
  body: string,
  file?: { key: string; name: string; type: string; size: number } | null,
  broadcastId?: string | null,
) {
  const supportId = await getSupportUserId();
  const conv = await getOrCreateConversation(supportId, userId, null);
  const msg = await createMessage({
    conversationId: conv.id,
    senderId: supportId,
    body,
    system: false, // support xabari — oddiy bubble
    file: file ?? null,
    broadcastId: broadcastId ?? null,
  });
  await deliverMessage(msg);
  return conv.id;
}

/** Ro'yxatdan o'tgach bir marta "xush kelibsiz" xabari. */
export async function sendWelcome(userId: string, firstName?: string | null) {
  const supportId = await getSupportUserId();
  const conv = await getOrCreateConversation(supportId, userId, null);
  const count = await db.message.count({ where: { conversationId: conv.id } });
  if (count > 0) return; // allaqachon yozilgan

  const hi = firstName ? `Assalomu alaykum, ${firstName}!` : "Assalomu alaykum!";
  const msg = await createMessage({
    conversationId: conv.id,
    senderId: supportId,
    body:
      `${hi} tayyorr.uz'ga xush kelibsiz 🎉\n\n` +
      `Bu — tayyorr.uz support. Har qanday savol, muammo yoki taklif bo'lsa ` +
      `shu yerga yozing — yordam beramiz.`,
    system: false, // support xabari — oddiy bubble
  });
  await deliverMessage(msg);
}
