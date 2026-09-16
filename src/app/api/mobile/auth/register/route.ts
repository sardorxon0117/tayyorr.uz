import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile-auth";
import { logActivity } from "@/lib/activity";
import { logToGroup, siteUrl } from "@/lib/telegram-log";
import { sendWelcome } from "@/lib/support-actions";
import { TERMS_VERSION } from "@/lib/terms";
import { ME_SELECT, serializeMe } from "@/lib/mobile-me";

const schema = z.object({
  role: z.enum(["ORDERER", "PREPARER"]),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Oferta shartlariga rozilik bering" }),
  }),
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  login: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Login faqat harf, raqam, _ va . dan iborat bo'lsin"),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  about: z.string().trim().min(5).max(1000),
});

/**
 * Flutter ilovasidan to'g'ridan-to'g'ri ro'yxatdan o'tish (email+parol —
 * saytdagi Google-orqali-onboarding'dan farqli, alohida yo'l). Rasm
 * ixtiyoriy — profilda keyinroq qo'shsa ham bo'ladi.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ma'lumotlarni to'ldiring" },
      { status: 400 },
    );
  }
  const { login, email, password, firstName, lastName, role, about } = parsed.data;

  const [loginClash, emailClash] = await Promise.all([
    db.user.findUnique({ where: { login }, select: { id: true } }),
    db.user.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (loginClash) {
    return NextResponse.json({ error: "Bu login band" }, { status: 409 });
  }
  if (emailClash) {
    return NextResponse.json({ error: "Bu email allaqachon ro'yxatdan o'tgan" }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      login,
      email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      role,
      about,
      passwordHash: await bcrypt.hash(password, 10),
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
    select: ME_SELECT,
  });

  const token = signMobileToken(user.id);

  await sendWelcome(user.id, firstName).catch(() => {});
  await logActivity(
    user.id,
    "REGISTER",
    `Ro'yxatdan o'tdi (mobil ilova) — @${login} (${role === "PREPARER" ? "Tayyorlovchi" : "Buyurtma beruvchi"})`,
  );
  await logToGroup(
    "registrations",
    "🆕 Yangi ro'yxatdan o'tish (mobil ilova)",
    [
      `Login: @${login}`,
      `Ism: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Rol: ${role === "PREPARER" ? "Tayyorlovchi" : "Buyurtma beruvchi"}`,
      `Foydalanuvchi ID: ${user.id}`,
    ],
    siteUrl(`/sardorxon/admin/users/${user.id}`),
  );

  return NextResponse.json({ token, user: serializeMe(user) }, { status: 201 });
}
