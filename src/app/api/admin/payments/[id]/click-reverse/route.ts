import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin";
import { reverseClickPayment, clickMerchantApiConfigured } from "@/lib/click-merchant-api";
import { reverseWalletTopup } from "@/lib/wallet-reversal";

/**
 * Click orqali to'langan summani haqiqatan ham kartaga qaytaradi (Click
 * Merchant API — "To'lovni bekor qilish"), muvaffaqiyatli bo'lsa bizning
 * ichki hisobimizni ham (hamyon balansi) mos ravishda to'g'irlaydi.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  if (!clickMerchantApiConfigured()) {
    return NextResponse.json(
      { error: "Click Merchant API sozlanmagan (CLICK_MERCHANT_USER_ID yo'q)" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const wtx = await db.walletTransaction.findUnique({ where: { id } });
  if (!wtx || wtx.method !== "CLICK") {
    return NextResponse.json({ error: "Click tranzaksiyasi emas" }, { status: 400 });
  }
  if (wtx.status !== "SUCCESS" || wtx.reversedAt) {
    return NextResponse.json(
      { error: "Faqat muvaffaqiyatli va hali bekor qilinmagan to'lovni qaytarish mumkin" },
      { status: 400 },
    );
  }

  const meta = (wtx.meta as Record<string, unknown>) ?? {};
  const clickTransId = String(meta.clickTransId ?? "");
  if (!clickTransId) {
    return NextResponse.json({ error: "Click tranzaksiya ID topilmadi" }, { status: 400 });
  }

  const result = await reverseClickPayment(clickTransId);
  if (result.data?.error_code !== 0) {
    return NextResponse.json(
      { error: result.data?.error_note || "Click to'lovni qaytarishni rad etdi" },
      { status: 400 },
    );
  }

  await reverseWalletTopup(wtx, "admin_click_reversal");
  return NextResponse.json({ ok: true });
}
