import { NextResponse, after } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";
import { postOrderToChannel } from "@/lib/telegram";

const createSchema = z.object({
  title: z.string().min(5).max(150),
  type: z
    .enum([
      "PRESENTATION",
      "COURSE_WORK",
      "REFERAT",
      "ESSAY",
      "DIPLOMA",
      "OTHER",
    ])
    .default("OTHER"),
  description: z.string().min(10).max(5000),
  deadline: z.string().datetime().optional(),
  budget: z.number().int().positive().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }

  const where =
    session.user.role === "ORDERER"
      ? { ordererId: session.user.id }
      : {
          OR: [
            { status: "OPEN" as const },
            { preparerId: session.user.id },
          ],
        };

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      orderer: {
        select: { id: true, name: true, login: true, avatarUrl: true, image: true },
      },
      _count: { select: { offers: true } },
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  if (session.user.role !== "ORDERER") {
    return NextResponse.json(
      { error: "Faqat buyurtma beruvchilar buyurtma qo'sha oladi" },
      { status: 403 },
    );
  }
  const restricted = await restrictionApiError(session.user.id);
  if (restricted) return restricted;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot" },
      { status: 400 },
    );
  }

  const { title, type, description, deadline, budget } = parsed.data;

  const order = await db.order.create({
    data: {
      ordererId: session.user.id,
      title,
      type,
      description,
      deadline: deadline ? new Date(deadline) : null,
      budget,
    },
  });

  // javob yuborilgach kanalga joylaymiz — buyurtma yaratilishiga ta'sir qilmaydi
  after(() => postOrderToChannel(order));

  return NextResponse.json({ order }, { status: 201 });
}
