import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await db.user
    .update({ where: { id: session.user.id }, data: { lastSeenAt: new Date() } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
