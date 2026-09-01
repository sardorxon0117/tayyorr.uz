import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getConversationForUser, otherUserId } from "@/lib/chat";
import { toClientMessages } from "@/lib/chat-messages";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const { id } = await params;
  const me = session.user.id;

  const conv = await getConversationForUser(id, me);
  if (!conv) {
    return NextResponse.json({ error: "Suhbat topilmadi" }, { status: 404 });
  }

  const url = new URL(req.url);
  // `since` = ko'rilgan eng katta updatedAt (ms). Yangi + tahrirlangan + o'chirilgan xabarlarni qaytaradi.
  const since = url.searchParams.get("since");

  const rows = await db.message.findMany({
    where: {
      conversationId: id,
      ...(since ? { updatedAt: { gt: new Date(Number(since)) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  const other = await db.user.findUnique({
    where: { id: otherUserId(conv, me) },
    select: { id: true, name: true, login: true, avatarUrl: true, image: true },
  });

  return NextResponse.json({
    conversation: { id: conv.id, orderId: conv.orderId },
    other: other && {
      id: other.id,
      name: other.name ?? other.login ?? "Foydalanuvchi",
      login: other.login,
      image: other.avatarUrl ?? other.image ?? null,
    },
    messages: await toClientMessages(rows, me),
  });
}
