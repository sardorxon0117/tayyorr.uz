import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).optional().default(""),
  buttonText: z.string().trim().max(60).optional().default(""),
  buttonUrl: z.string().trim().max(500).optional().default(""),
  role: z.enum(["ORDERER", "PREPARER"]).nullable().optional().default(null),
  active: z.boolean().default(true),
});

/** Yangi e'lon banneri qo'shadi. */
export async function POST(req: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Sarlavha kerak" }, { status: 400 });
  }
  const { title, body, buttonText, buttonUrl, role, active } = parsed.data;

  const a = await db.announcement.create({
    data: {
      title,
      body,
      buttonText: buttonText || null,
      buttonUrl: buttonUrl || null,
      role: role ?? null,
      active,
    },
  });

  return NextResponse.json({ ok: true, id: a.id });
}
