import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";

const schema = z.object({
  title: z.string().trim().max(200),
  body: z.string().trim().max(2000),
  buttonText: z.string().trim().max(60).optional().default(""),
  buttonUrl: z.string().trim().max(500).optional().default(""),
  active: z.boolean().default(true),
});

/** E'lon bannerini saqlaydi (bitta yozuv). Bo'sh sarlavha — o'chiradi. */
export async function PUT(req: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri ma'lumot" }, { status: 400 });
  }
  const { title, body, buttonText, buttonUrl, active } = parsed.data;

  await db.announcement.deleteMany({});
  if (title) {
    await db.announcement.create({
      data: {
        title,
        body,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        active,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
