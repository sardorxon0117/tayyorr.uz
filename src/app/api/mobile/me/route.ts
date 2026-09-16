import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { ME_SELECT, serializeMe } from "@/lib/mobile-me";

/** Joriy foydalanuvchi profili (mobil ilova bosh ekrani uchun). */
export async function GET(req: Request) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: ME_SELECT,
  });
  if (!user) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({ user: serializeMe(user) });
}
