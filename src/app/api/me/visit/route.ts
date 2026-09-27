import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Foydalanuvchi saytga tashrif buyurgani — login emas, oddiy "onlayn
 * bo'ldi" holati. Klient (VisitPing) buni har bir yangi brauzer
 * sessiyasida (sessionStorage tozalanganda — tab ochilganda) bir marta
 * chaqiradi, shuning uchun bu yerda alohida throttling shart emas: har
 * chaqiruv — alohida tashrif.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;

  await db.siteVisit
    .create({
      data: { userId: session.user.id, ip, userAgent: h.get("user-agent") },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
