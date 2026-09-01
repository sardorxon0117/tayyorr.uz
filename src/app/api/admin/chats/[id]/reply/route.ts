import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { createMessage } from "@/lib/chat";
import { getSupportUserId } from "@/lib/support";
import { publishToConversation } from "@/lib/chat-bus";
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

/** Admin "tayyorr.uz support" nomidan suhbatga javob yozadi. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const supportId = await getSupportUserId();

  const conv = await db.conversation.findUnique({ where: { id } });
  if (!conv) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (conv.userAId !== supportId && conv.userBId !== supportId) {
    return NextResponse.json(
      { error: "Bu support suhbati emas. Foydalanuvchi sahifasidan xabar yozing." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.body && !parsed.data.file)) {
    return NextResponse.json({ error: "Xabar yoki fayl kerak" }, { status: 400 });
  }

  const msg = await createMessage({
    conversationId: id,
    senderId: supportId,
    body: parsed.data.body ?? "",
    system: true,
    file: parsed.data.file ?? null,
  });

  const fileOut = msg.fileKey
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
    : null;

  publishToConversation(id, {
    type: "message",
    message: {
      id: msg.id,
      conversationId: id,
      senderId: supportId,
      body: msg.body,
      system: true,
      createdAt: msg.createdAt.toISOString(),
      file: fileOut,
    },
  });

  return NextResponse.json({
    message: {
      id: msg.id,
      senderId: supportId,
      body: msg.body,
      system: true,
      createdAt: msg.createdAt.getTime(),
      mine: true,
      file: fileOut,
    },
  });
}
