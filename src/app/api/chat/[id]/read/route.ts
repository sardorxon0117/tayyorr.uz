import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getConversationForUser } from "@/lib/chat";
import { publishToConversation } from "@/lib/chat-bus";

export async function POST(
  _req: Request,
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

  const res = await db.message.updateMany({
    where: { conversationId: id, senderId: { not: me }, readAt: null },
    data: { readAt: new Date() },
  });

  if (res.count > 0) {
    publishToConversation(id, {
      type: "read",
      by: me,
      at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, marked: res.count });
}
