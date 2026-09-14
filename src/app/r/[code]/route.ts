import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyorr.uz";
const REF_COOKIE = "tyr_ref";
const UREF_COOKIE = "tyr_uref"; // shaxsiy (foydalanuvchidan-foydalanuvchiga) referal
const REF_MAX_AGE = 60 * 60 * 24 * 30; // 30 kun

/**
 * Tashrif havolasi: /r/<code>
 * Avval admin yaratgan marketing havolasi (ReferralLink) tekshiriladi;
 * topilmasa, `code` biror foydalanuvchining ID'si bo'lishi mumkin —
 * shaxsiy referal havolasi (/r/<userId>). Login emas, ID ishlatiladi —
 * shunda havolaga qarab bu referal ekanini yoki kim taklif qilayotganini
 * bilib bo'lmaydi. Tashrif sonini oshiradi, brauzerga referal cookie
 * qo'yadi va bosh sahifaga yo'naltiradi. Foydalanuvchi keyinroq
 * ro'yxatdan o'tsa (onboarding), shu cookie orqali qaysi havoladan/kimdan
 * kelgani aniqlanadi.
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

  if (link) {
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

  const referrer = await db.user
    .findUnique({
      where: { id: code },
      select: { id: true },
    })
    .catch(() => null);

  if (referrer) {
    const res = NextResponse.redirect(home);
    res.cookies.set(UREF_COOKIE, referrer.id, {
      maxAge: REF_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.redirect(home);
}
