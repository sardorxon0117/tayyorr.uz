import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { getSupportUserId } from "@/lib/support";
import { deliverMessage } from "@/lib/chat-notify";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { bannedUntil: true } });
  if (!user) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  await db.user.update({
    where: { id },
    data: { bannedUntil: null, banReason: null },
  });

  const supportId = await getSupportUserId();
  const conv = await getOrCreateConversation(supportId, id);
  const m = await createMessage({
    conversationId: conv.id,
    senderId: supportId,
    body: "Hisobingizdagi cheklov bekor qilindi. Platformadan to'liq foydalanishingiz mumkin.",
    system: false, // support xabari — oddiy bubble
  });
  await deliverMessage(m);

  return NextResponse.json({ ok: true });
}
