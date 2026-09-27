import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const VISIT_GAP_MS = 20 * 60 * 1000; // shu vaqtdan ko'p o'tsa — yangi "tashrif"

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const userId = session.user.id;

  await db.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
    .catch(() => {});

  // saytga tashrif — login emas, shunchaki ko'rib chiqish. Har ping'da
  // yozib chiqmaymiz (60s'da bir keladi) — oxirgi yozuvdan VISIT_GAP_MS
  // o'tgan bo'lsagina yangi tashrif deb hisoblaymiz.
  try {
    const last = await db.siteVisit.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!last || Date.now() - last.createdAt.getTime() > VISIT_GAP_MS) {
      const h = await headers();
      const ip =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip") ||
        null;
      await db.siteVisit.create({
        data: { userId, ip, userAgent: h.get("user-agent") },
      });
    }
  } catch {
    /* tashrifni yozib bo'lmasa ham davom etamiz */
  }

  return NextResponse.json({ ok: true });
}
