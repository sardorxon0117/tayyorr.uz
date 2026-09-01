import { db } from "@/lib/db";

/** Juftlikni doim bir xil tartibda saqlaymiz. */
export function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateConversation(
  meId: string,
  otherId: string,
  orderId?: string | null,
) {
  if (meId === otherId) throw new Error("O'zingiz bilan suhbat bo'lmaydi");
  const [userAId, userBId] = orderedPair(meId, otherId);

  const existing = await db.conversation.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (existing) {
    if (orderId && !existing.orderId) {
      return db.conversation.update({
        where: { id: existing.id },
        data: { orderId },
      });
    }
    return existing;
  }

  return db.conversation.create({
    data: { userAId, userBId, orderId: orderId ?? null },
  });
}

/** Suhbat a'zosi ekanini tekshiradi (admin yashirgan bo'lsa null), aks holda null. */
export async function getConversationForUser(convId: string, userId: string) {
  const conv = await db.conversation.findUnique({ where: { id: convId } });
  if (!conv) return null;
  if (conv.userAId !== userId && conv.userBId !== userId) return null;
  if (conv.hiddenFromUsersAt) return null; // admin foydalanuvchilardan yashirgan
  return conv;
}

export function otherUserId(
  conv: { userAId: string; userBId: string },
  meId: string,
) {
  return conv.userAId === meId ? conv.userBId : conv.userAId;
}

/** Xabar yaratadi va suhbatning lastMessageAt'ini yangilaydi. */
export async function createMessage(opts: {
  conversationId: string;
  senderId: string;
  body?: string;
  system?: boolean;
  file?: {
    key: string;
    name: string;
    type: string;
    size: number;
  } | null;
}) {
  return db.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: {
        conversationId: opts.conversationId,
        senderId: opts.senderId,
        body: opts.body ?? "",
        system: opts.system ?? false,
        fileKey: opts.file?.key ?? null,
        fileName: opts.file?.name ?? null,
        fileType: opts.file?.type ?? null,
        fileSize: opts.file?.size ?? null,
      },
    });
    await tx.conversation.update({
      where: { id: opts.conversationId },
      data: { lastMessageAt: m.createdAt },
    });
    return m;
  });
}
