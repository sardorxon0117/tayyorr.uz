import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";

/** Ommaviy xabarni hamma uchun o'chiradi (barcha qabul qiluvchilardan). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const b = await db.broadcast.findUnique({ where: { id } });
  if (!b) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const del = await db.message.deleteMany({ where: { broadcastId: id } });
  await db.broadcast.delete({ where: { id } });

  return NextResponse.json({ ok: true, removed: del.count });
}

/** Ommaviy xabar matnini hamma qabul qiluvchilarda tahrirlaydi. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const { id } = await params;
  const b = await db.broadcast.findUnique({ where: { id } });
  if (!b) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const data = (await req.json().catch(() => ({}))) as { body?: unknown };
  const body = typeof data.body === "string" ? data.body.trim() : "";
  if (!body) return NextResponse.json({ error: "Matn bo'sh" }, { status: 400 });

  await db.broadcast.update({ where: { id }, data: { body } });
  const upd = await db.message.updateMany({
    where: { broadcastId: id },
    data: { body, editedAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: upd.count, body });
}
