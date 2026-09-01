import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { createMessage, getOrCreateConversation } from "@/lib/chat";
import { getSupportUserId } from "@/lib/support";
import { deliverMessage } from "@/lib/chat-notify";

const schema = z.object({
  // kun soni; 0 yoki bo'sh = muddatsiz
  days: z.coerce.number().int().min(0).max(3650).optional(),
  reason: z.string().trim().max(1000).optional(),
  notify: z.boolean().optional().default(true),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }
  const { days, reason, notify } = parsed.data;

  const user = await db.user.findUnique({ where: { id }, select: { isSupport: true } });
  if (!user) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (user.isSupport) {
    return NextResponse.json({ error: "Support hisobini cheklab bo'lmaydi" }, { status: 400 });
  }

  const until =
    days && days > 0
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // ~muddatsiz

  await db.user.update({
    where: { id },
    data: { bannedUntil: until, banReason: reason || null },
  });

  if (notify) {
    const supportId = await getSupportUserId();
    const conv = await getOrCreateConversation(supportId, id);
    const when =
      days && days > 0
        ? until.toLocaleString("uz", { dateStyle: "medium", timeStyle: "short" })
        : "muddatsiz";
    const body = `Hisobingiz ${when} cheklandi.${
      reason ? ` Sabab: ${reason}.` : ""
    } Bu davrda siz faqat «tayyorr.uz support» bilan yozisha olasiz. Savollaringiz bo'lsa shu yerga yozing.`;
    const m = await createMessage({
      conversationId: conv.id,
      senderId: supportId,
      body,
      system: false, // support xabari — oddiy bubble
    });
    await deliverMessage(m);
  }

  return NextResponse.json({ ok: true, until });
}
