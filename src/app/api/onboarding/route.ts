import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  role: z.enum(["ORDERER", "PREPARER"]),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  login: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Login faqat harf, raqam, _ va . dan iborat bo'lsin"),
  password: z.string().min(6).max(100),
  about: z.string().min(5).max(1000),
  avatarUrl: z.string().url(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval Google bilan kiring" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Barcha maydonlarni to'ldiring" },
      { status: 400 },
    );
  }

  const { login, password, firstName, lastName, ...rest } = parsed.data;

  const clash = await db.user.findFirst({
    where: { login, NOT: { id: session.user.id } },
  });
  if (clash) {
    return NextResponse.json({ error: "Bu login band" }, { status: 409 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      login,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      passwordHash: await bcrypt.hash(password, 10),
      ...rest,
    },
  });

  return NextResponse.json({ ok: true });
}
