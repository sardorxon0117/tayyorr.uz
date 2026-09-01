import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  suspectId: z.string().optional(),
  orderId: z.string().optional(),
  body: z.string().trim().min(10).max(3000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Shikoyat matni qisqa" },
      { status: 400 },
    );
  }
  const { suspectId, orderId, body } = parsed.data;

  if (suspectId && suspectId === session.user.id) {
    return NextResponse.json(
      { error: "O'zingiz ustidan shikoyat yozib bo'lmaydi" },
      { status: 400 },
    );
  }

  await db.complaint.create({
    data: {
      reporterId: session.user.id,
      suspectId: suspectId || null,
      orderId: orderId || null,
      body,
    },
  });

  return NextResponse.json({ ok: true });
}
