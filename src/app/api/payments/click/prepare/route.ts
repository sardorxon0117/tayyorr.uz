import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  CLICK_SERVICE_ID,
  ClickError,
  clickErrorNote,
  parseClickBody,
  verifyPrepareSign,
} from "@/lib/click";

function fail(code: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: code, error_note: clickErrorNote(code), ...extra });
}

/** Click "Prepare" bosqichi — to'lovdan oldin buyurtma haqiqiyligini tekshiradi. */
export async function POST(req: Request) {
  const b = await parseClickBody(req);

  const click_trans_id = b.click_trans_id ?? "";
  const service_id = b.service_id ?? "";
  const merchant_trans_id = b.merchant_trans_id ?? "";
  const amount = b.amount ?? "";
  const action = b.action ?? "";
  const sign_time = b.sign_time ?? "";
  const sign_string = b.sign_string ?? "";

  if (service_id !== CLICK_SERVICE_ID) {
    return fail(ClickError.BAD_REQUEST, { click_trans_id, merchant_trans_id });
  }
  if (
    !verifyPrepareSign({
      click_trans_id,
      service_id,
      merchant_trans_id,
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
  if (wtx.status === "SUCCESS") {
    return fail(ClickError.ALREADY_PAID, { click_trans_id, merchant_trans_id });
  }
  if (wtx.status === "FAILED") {
    return fail(ClickError.TRANSACTION_CANCELLED, { click_trans_id, merchant_trans_id });
  }

  const amt = Math.round(parseFloat(amount));
  if (!Number.isFinite(amt) || amt !== wtx.amount) {
    return fail(ClickError.WRONG_AMOUNT, { click_trans_id, merchant_trans_id });
  }

  const prepareId = Date.now();
  const meta = (wtx.meta as Record<string, unknown>) ?? {};
  await db.walletTransaction.update({
    where: { id: wtx.id },
    data: {
      meta: { ...meta, clickTransId: click_trans_id, clickPrepareId: prepareId },
    },
  });

  return NextResponse.json({
    click_trans_id,
    merchant_trans_id,
    merchant_prepare_id: prepareId,
    error: ClickError.SUCCESS,
    error_note: "Success",
  });
}
