import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import {
  getConversationForUser,
  createMessage,
  otherUserId,
  blockState,
} from "@/lib/chat";
import { toClientMessages, toClientMessage } from "@/lib/chat-messages";
import { deliverMessage } from "@/lib/chat-notify";
import { getRestriction, restrictionText } from "@/lib/restriction";
import { getSupportUserId } from "@/lib/support";

export { OPTIONS } from "@/lib/mobile-cors";

/** Bitta suhbat: boshqa foydalanuvchi + xabarlar (matn xabarlar, mobil v1). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const me = auth.userId;

  const conv = await getConversationForUser(id, me);
  if (!conv) return mobileJson({ error: "Suhbat topilmadi" }, { status: 404 });

  const url = new URL(req.url);
  const since = url.searchParams.get("since");

  const rows = await db.message.findMany({
    where: {
      conversationId: id,
      ...(since ? { updatedAt: { gt: new Date(Number(since)) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 300,
    include: { reactions: true },
  });

  const otherId = otherUserId(conv, me);
  const other = await db.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, login: true, avatarUrl: true, image: true, isSupport: true },
  });

  const messages = await toClientMessages(rows, me);

  return mobileJson({
    conversation: { id: conv.id },
    other: other && {
      id: other.id,
      name: other.name ?? other.login ?? "Foydalanuvchi",
      login: other.login,
      image: other.avatarUrl ?? other.image ?? null,
      isSupport: other.isSupport,
    },
    messages,
  });
}

const sendSchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const me = auth.userId;

  const conv = await getConversationForUser(id, me);
  if (!conv) return mobileJson({ error: "Suhbat topilmadi" }, { status: 404 });

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return mobileJson({ error: "Xabar bo'sh bo'lmasin" }, { status: 400 });
  }

  const supportId = await getSupportUserId();
  const isSupportThread = conv.userAId === supportId || conv.userBId === supportId;

  const restriction = await getRestriction(me);
  if (restriction && !isSupportThread) {
    return mobileJson({ error: restrictionText(restriction) }, { status: 403 });
  }

  if (!isSupportThread) {
    const bs = await blockState(me, otherUserId(conv, me));
    if (bs.iBlocked) {
      return mobileJson(
        { error: "Siz bu foydalanuvchini bloklagansiz. Avval blokdan chiqaring." },
        { status: 403 },
      );
    }
    if (bs.blockedMe) {
      return mobileJson({ error: 'Bu foydalanuvchi sizni bloklagan.' }, { status: 403 });
    }
  }

  const msg = await createMessage({
    conversationId: id,
    senderId: me,
    body: parsed.data.body,
  });
  await deliverMessage(msg);

  return mobileJson({ message: await toClientMessage(msg, me) }, { status: 201 });
}
