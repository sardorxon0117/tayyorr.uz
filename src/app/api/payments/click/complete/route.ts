import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { sendTelegramToUser, siteUrl } from "@/lib/telegram-notify";
import {
  CLICK_SERVICE_ID,
  ClickError,
  clickErrorNote,
  parseClickBody,
  verifyCompleteSign,
} from "@/lib/click";

function fail(code: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: code, error_note: clickErrorNote(code), ...extra });
}

/** Click "Complete" bosqichi — to'lov yakunlandi, balansni oshiramiz. */
export async function POST(req: Request) {
  const b = await parseClickBody(req);

  const click_trans_id = b.click_trans_id ?? "";
  const service_id = b.service_id ?? "";
  const merchant_trans_id = b.merchant_trans_id ?? "";
  const merchant_prepare_id = b.merchant_prepare_id ?? "";
  const amount = b.amount ?? "";
  const action = b.action ?? "";
  const sign_time = b.sign_time ?? "";
  const sign_string = b.sign_string ?? "";
  const incomingError = Number(b.error ?? "0");

  if (service_id !== CLICK_SERVICE_ID) {
    return fail(ClickError.BAD_REQUEST, { click_trans_id, merchant_trans_id });
  }
  if (
    !verifyCompleteSign({
      click_trans_id,
      service_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
      sign_string,
    })
  ) {
    return fail(ClickError.SIGN_FAILED, { click_trans_id, merchant_trans_id });
  }

  const wtx = await db.walletTransaction.findUnique({ where: { id: merchant_trans_id } });
  if (!wtx || wtx.method !== "CLICK") {
    return fail(ClickError.ORDER_NOT_FOUND, { click_trans_id, merchant_trans_id });
  }

  const meta = (wtx.meta as Record<string, unknown>) ?? {};
  if (String(meta.clickPrepareId ?? "") !== merchant_prepare_id) {
    return fail(ClickError.TRANSACTION_NOT_FOUND, { click_trans_id, merchant_trans_id });
  }

  if (wtx.status === "SUCCESS") {
    return fail(ClickError.ALREADY_PAID, {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: wtx.id,
    });
  }

  // Click o'zi to'lovni bekor qilgan (foydalanuvchi bekor qildi va h.k.) — faqat qayd etamiz
  if (incomingError < 0) {
    await db.walletTransaction.update({
      where: { id: wtx.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: wtx.id,
      error: ClickError.SUCCESS,
      error_note: "Success",
    });
  }

  const amt = Math.round(parseFloat(amount));
  if (!Number.isFinite(amt) || amt !== wtx.amount) {
    return fail(ClickError.WRONG_AMOUNT, { click_trans_id, merchant_trans_id });
  }

  await db.$transaction(async (tx) => {
    await tx.walletTransaction.update({
      where: { id: wtx.id },
      data: {
        status: "SUCCESS",
        meta: { ...meta, clickTransId: click_trans_id },
      },
    });
    await tx.user.update({
      where: { id: wtx.userId },
      data: { balance: { increment: wtx.amount } },
    });
  });

  await logActivity(
    wtx.userId,
    "WALLET_TOPUP",
    `Hisobni Click orqali to'ldirdi: ${wtx.amount.toLocaleString("ru-RU")} so'm`,
    { amount: wtx.amount, clickTransId: click_trans_id },
  );

  await sendTelegramToUser(wtx.userId, {
    title: "💳 Hisob to'ldirildi",
    body: `${wtx.amount.toLocaleString("ru-RU")} so'm Click orqali hamyoningizga tushdi.`,
    url: siteUrl("/wallet"),
    buttonLabel: "Tranzaksiyalarni ko'rish",
  });

  return NextResponse.json({
    click_trans_id,
    merchant_trans_id,
    merchant_confirm_id: wtx.id,
    error: ClickError.SUCCESS,
    error_note: "Success",
  });
}
