import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { mobileJson } from "@/lib/mobile-cors";
import { buildClickPayUrl, CLICK_MIN, CLICK_MAX } from "@/lib/click";
import { siteUrl } from "@/lib/telegram-log";

export { OPTIONS } from "@/lib/mobile-cors";

const schema = z.object({
  amount: z.coerce.number().int(),
});

/** Mobil ilovadan Click orqali hisobni to'ldirish — web bilan bir xil oqim. */
export async function POST(req: Request) {
  const auth = await requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return mobileJson({ error: "Ma'lumotlar noto'g'ri" }, { status: 400 });
  }
  const { amount } = parsed.data;

  if (amount < CLICK_MIN || amount > CLICK_MAX) {
    return mobileJson(
      {
        error: `Summa ${CLICK_MIN.toLocaleString("ru-RU")} – ${CLICK_MAX.toLocaleString("ru-RU")} so'm oralig'ida bo'lsin`,
      },
      { status: 400 },
    );
  }

  const wtx = await db.walletTransaction.create({
    data: {
      userId: auth.userId,
      type: "TOPUP",
      status: "PENDING",
      amount,
      method: "CLICK",
      note: "Click orqali to'ldirish (mobil ilova)",
    },
  });

  const payUrl = buildClickPayUrl({
    amount,
    transactionParam: wtx.id,
    returnUrl: siteUrl("/wallet?click=1"),
  });

  return mobileJson({ ok: true, payUrl });
}
