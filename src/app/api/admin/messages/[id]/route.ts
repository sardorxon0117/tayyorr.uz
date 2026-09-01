import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";

/** Bitta xabarni butunlay o'chiradi (admin uchun ham qolmaydi). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const msg = await db.message.findUnique({ where: { id } });
  if (!msg) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  await db.message.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
