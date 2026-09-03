import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  role: z.enum(["ORDERER", "PREPARER"]).optional(),
  login: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Login faqat harf, raqam, _ va . dan iborat")
    .optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  const restricted = await restrictionApiError(session.user.id);
  if (restricted) return restricted;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot" },
      { status: 400 },
    );
  }
  const { role, login, newPassword } = parsed.data;
  const me = session.user.id;

  const user = await db.user.findUnique({
    where: { id: me },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const data: Record<string, unknown> = {};

  // ---- rol ----
  if (role && role !== user.role) {
    const activeOrders = await db.order.count({
      where: {
        OR: [{ ordererId: me }, { preparerId: me }],
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    });
    const activeOffers = await db.offer.count({
      where: { preparerId: me, status: { in: ["PENDING", "ACCEPTED"] } },
    });
    if (activeOrders > 0 || activeOffers > 0) {
      return NextResponse.json(
        {
          error:
            "Faol buyurtma yoki takliflaringiz bor — rolni hozir o'zgartirib bo'lmaydi.",
        },
        { status: 400 },
      );
    }
    data.role = role;
  }

  // ---- login ----
  if (login) {
    const clash = await db.user.findFirst({
      where: { login, NOT: { id: me } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json({ error: "Bu login band" }, { status: 409 });
    }
    data.login = login;
  }

  // ---- parol ----
  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "O'zgarish yo'q" }, { status: 400 });
  }

  await db.user.update({ where: { id: me }, data });

  const changed: string[] = [];
  if ("role" in data) changed.push(`rol → ${role}`);
  if ("login" in data) changed.push(`login → @${login}`);
  if ("passwordHash" in data) changed.push("parol yangilandi");
  await logActivity(
    me,
    "ACCOUNT_UPDATE",
    `Hisob sozlamalari: ${changed.join(", ")}`,
  );

  return NextResponse.json({ ok: true, roleChanged: "role" in data });
}
