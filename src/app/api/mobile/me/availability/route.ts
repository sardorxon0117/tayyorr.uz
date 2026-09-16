import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import { getRestriction, restrictionText } from "@/lib/restriction";

export { OPTIONS } from "@/lib/mobile-cors";

const schema = z.object({ isAvailable: z.boolean().optional() });

/** Tayyorlovchi "band/bo'sh" holatini almashtiradi — web bilan bir xil mantiq. */
export async function PATCH(req: Request) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;

  const me = await db.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, isAvailable: true },
  });
  if (!me) return mobileJson({ error: "Topilmadi" }, { status: 404 });
  if (me.role !== "PREPARER") {
    return mobileJson({ error: "Faqat tayyorlovchilar uchun" }, { status: 403 });
  }

  const restriction = await getRestriction(auth.userId);
  if (restriction) {
    return mobileJson({ error: restrictionText(restriction) }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const explicit = parsed.success ? parsed.data.isAvailable : undefined;
  const next = explicit ?? !me.isAvailable;

  const updated = await db.user.update({
    where: { id: auth.userId },
    data: { isAvailable: next },
    select: { isAvailable: true },
  });

  return mobileJson({ isAvailable: updated.isAvailable });
}
