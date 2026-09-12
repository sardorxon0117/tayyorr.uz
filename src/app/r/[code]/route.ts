import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyorr.uz";
const REF_COOKIE = "tyr_ref";
const REF_MAX_AGE = 60 * 60 * 24 * 30; // 30 kun

/**
 * Tashrif havolasi: /r/<code>
 * Tashrif sonini oshiradi, brauzerga referal cookie qo'yadi va bosh sahifaga
 * yo'naltiradi. Foydalanuvchi keyinroq ro'yxatdan o'tsa (onboarding), shu
 * cookie orqali qaysi havoladan kelgani aniqlanadi.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const home = new URL("/", SITE_URL);

  const link = await db.referralLink
    .findUnique({ where: { code: code.toUpperCase() } })
    .catch(() => null);

  if (!link) {
    return NextResponse.redirect(home);
  }

  await db.referralLink
    .update({ where: { id: link.id }, data: { visits: { increment: 1 } } })
    .catch(() => {});

  const res = NextResponse.redirect(home);
  res.cookies.set(REF_COOKIE, link.code, {
    maxAge: REF_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
