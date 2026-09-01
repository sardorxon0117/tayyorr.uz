import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { restrictionApiError } from "@/lib/restriction";

const schema = z.object({
  price: z.number().int().positive(),
  message: z.string().max(1000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Avval kiring" }, { status: 401 });
  }
  if (session.user.role !== "PREPARER") {
    return NextResponse.json(
      { error: "Faqat tayyorlovchilar taklif yubora oladi" },
      { status: 403 },
    );
  }
  const restricted = await restrictionApiError(session.user.id);
  if (restricted) return restricted;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Narxni to'g'ri kiriting" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.status !== "OPEN") {
    return NextResponse.json(
      { error: "Buyurtma takliflar uchun ochiq emas" },
      { status: 400 },
    );
  }

  const offer = await db.offer.upsert({
    where: { orderId_preparerId: { orderId: id, preparerId: session.user.id } },
    update: { price: parsed.data.price, message: parsed.data.message, status: "PENDING" },
    create: {
      orderId: id,
      preparerId: session.user.id,
      price: parsed.data.price,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ offer }, { status: 201 });
}
