import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getConversationForUser, createMessage } from "@/lib/chat";
import { publishToConversation } from "@/lib/chat-bus";
import { getRestriction, restrictionText } from "@/lib/restriction";
import { getSupportUserId } from "@/lib/support";
import { toClientMessage } from "@/lib/chat-messages";
import { PRIVATE_BUCKET, presignGet } from "@/lib/r2";

const schema = z.object({
  body: z.string().trim().max(4000).optional(),
  file: z
    .object({
      key: z.string().min(1),
      name: z.string().min(1).max(200),
      type: z.string().min(1).max(150),
      size: z.number().int().nonnegative(),
    })
    .optional(),
});

export async function POST(
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

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.body && !parsed.data.file)) {
    return NextResponse.json(
      { error: "Xabar yoki fayl bo'lishi kerak" },
      { status: 400 },
    );
  }

  // cheklangan foydalanuvchi faqat "tayyorr.uz support" bilan yozisha oladi
  const restriction = await getRestriction(me);
  if (restriction) {
    const supportId = await getSupportUserId();
    const isSupportThread =
      conv.userAId === supportId || conv.userBId === supportId;
    if (!isSupportThread) {
      return NextResponse.json({ error: restrictionText(restriction) }, { status: 403 });
    }
  }

  const msg = await createMessage({
    conversationId: id,
    senderId: me,
    body: parsed.data.body ?? "",
    file: parsed.data.file ?? null,
  });

  const client = await toClientMessage(msg, me);

  publishToConversation(id, {
    type: "message",
    message: {
      id: msg.id,
      conversationId: id,
      senderId: me,
      body: msg.body,
      system: false,
      createdAt: msg.createdAt.toISOString(),
      file: msg.fileKey
        ? {
            name: msg.fileName ?? "fayl",
            type: msg.fileType ?? "application/octet-stream",
            size: msg.fileSize ?? 0,
            url: await presignGet({
              bucket: PRIVATE_BUCKET,
              key: msg.fileKey,
              expiresIn: 3600,
            }),
          }
        : null,
    },
  });

  return NextResponse.json({ message: client });
}
