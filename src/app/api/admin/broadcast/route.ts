import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { sendSupportMessage } from "@/lib/support-actions";

const MAX = 5000;

function num(v: unknown): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export async function POST(req: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const body = str(raw.body);
  if (!body) {
    return NextResponse.json({ error: "Xabar matni bo'sh" }, { status: 400 });
  }

  const roleIn = str(raw.role);
  const role =
    roleIn === "ORDERER" || roleIn === "PREPARER" ? roleIn : undefined;
  const balanceMin = num(raw.balanceMin);
  const balanceMax = num(raw.balanceMax);
  const from = str(raw.registeredFrom);
  const to = str(raw.registeredTo);
  const preview = raw.preview === true;

  // bo'sh maydonlar hisobga olinmaydi (all)
  const where: Prisma.UserWhereInput = {
    isSupport: false,
    isPlatform: false,
    login: { not: null },
  };
  if (role) where.role = role;
  if (balanceMin !== undefined || balanceMax !== undefined) {
    where.balance = {};
    if (balanceMin !== undefined) where.balance.gte = balanceMin;
    if (balanceMax !== undefined) where.balance.lte = balanceMax;
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999`);
  }

  const count = await db.user.count({ where });

  if (preview) return NextResponse.json({ count });
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
      await sendSupportMessage(u.id, body);
      sent++;
    } catch {
      /* birini o'tkazib yuboramiz */
    }
  }

  const record = await db.broadcast.create({
    data: {
      body,
      role: role ?? null,
      balanceMin: balanceMin ?? null,
      balanceMax: balanceMax ?? null,
      regFrom: from ? new Date(from) : null,
      regTo: to ? new Date(`${to}T23:59:59.999`) : null,
      sentCount: sent,
    },
  });

  return NextResponse.json({
    ok: true,
    sent,
    broadcast: {
      id: record.id,
      body: record.body,
      sentCount: record.sentCount,
      createdAt: record.createdAt.toISOString(),
    },
  });
}
