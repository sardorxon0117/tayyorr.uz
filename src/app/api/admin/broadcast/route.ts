import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { sendSupportMessage } from "@/lib/support-actions";

const schema = z.object({
  body: z.string().trim().min(1).max(4000),
  role: z.enum(["ORDERER", "PREPARER"]).optional(),
  balanceMin: z.coerce.number().int().nonnegative().optional(),
  balanceMax: z.coerce.number().int().nonnegative().optional(),
  registeredFrom: z.string().optional(),
  registeredTo: z.string().optional(),
  preview: z.boolean().optional(),
});

const MAX = 5000;

export async function POST(req: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ma'lumot noto'g'ri" }, { status: 400 });
  }
  const d = parsed.data;

  const where: Prisma.UserWhereInput = {
    isSupport: false,
    isPlatform: false,
    login: { not: null },
    role: d.role ?? undefined,
  };
  if (d.balanceMin != null || d.balanceMax != null) {
    where.balance = {
      ...(d.balanceMin != null ? { gte: d.balanceMin } : {}),
      ...(d.balanceMax != null ? { lte: d.balanceMax } : {}),
    };
  }
  if (d.registeredFrom || d.registeredTo) {
    where.createdAt = {
      ...(d.registeredFrom ? { gte: new Date(d.registeredFrom) } : {}),
      ...(d.registeredTo ? { lte: new Date(`${d.registeredTo}T23:59:59`) } : {}),
    };
  }

  const count = await db.user.count({ where });

  if (d.preview) {
    return NextResponse.json({ count });
  }
  if (count === 0) {
    return NextResponse.json({ error: "Filtrga mos foydalanuvchi yo'q" }, { status: 400 });
  }
  if (count > MAX) {
    return NextResponse.json(
      { error: `Juda ko'p (${count}). Filtrni toraytiring (maks. ${MAX}).` },
      { status: 400 },
    );
  }

  const users = await db.user.findMany({ where, select: { id: true }, take: MAX });
  let sent = 0;
  for (const u of users) {
    try {
      await sendSupportMessage(u.id, d.body);
      sent++;
    } catch {
      /* birini o'tkazib yuboramiz */
    }
  }

  return NextResponse.json({ ok: true, sent });
}
