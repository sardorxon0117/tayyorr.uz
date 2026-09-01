import { NextResponse } from "next/server";
import { z } from "zod";

import { adminApiGuard } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  PRIVATE_BUCKET,
  PUBLIC_BUCKET,
  buildKey,
  presignPut,
  publicUrl,
} from "@/lib/r2";

const schema = z.object({
  kind: z.enum(["CHAT", "AVATAR", "BROADCAST"]).default("CHAT"),
  conversationId: z.string().optional(),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(150),
});

export async function POST(req: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }
  const { kind, conversationId, filename, contentType } = parsed.data;

  if (kind === "AVATAR") {
    const key = buildKey("avatars/support", filename);
    const uploadUrl = await presignPut({ bucket: PUBLIC_BUCKET, key, contentType });
    return NextResponse.json({
      uploadUrl,
      key,
      bucket: "public",
      publicUrl: publicUrl(key),
    });
  }

  if (kind === "BROADCAST") {
    const key = buildKey("broadcast", filename);
    const uploadUrl = await presignPut({ bucket: PRIVATE_BUCKET, key, contentType });
    return NextResponse.json({ uploadUrl, key, bucket: "private" });
  }

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId kerak" }, { status: 400 });
  }
  const conv = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return NextResponse.json({ error: "Suhbat topilmadi" }, { status: 404 });

  const key = buildKey(`chat/${conversationId}`, filename);
  const uploadUrl = await presignPut({ bucket: PRIVATE_BUCKET, key, contentType });
  return NextResponse.json({ uploadUrl, key, bucket: "private" });
}
