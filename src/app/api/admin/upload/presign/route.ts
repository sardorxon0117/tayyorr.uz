import { NextResponse } from "next/server";
import { z } from "zod";

import { adminApiGuard } from "@/lib/admin";
import { db } from "@/lib/db";
import { PRIVATE_BUCKET, buildKey, presignPut } from "@/lib/r2";

const schema = z.object({
  conversationId: z.string().min(1),
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
  const { conversationId, filename, contentType } = parsed.data;

  const conv = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return NextResponse.json({ error: "Suhbat topilmadi" }, { status: 404 });

  const key = buildKey(`chat/${conversationId}`, filename);
  const uploadUrl = await presignPut({ bucket: PRIVATE_BUCKET, key, contentType });
  return NextResponse.json({ uploadUrl, key, bucket: "private" });
}
