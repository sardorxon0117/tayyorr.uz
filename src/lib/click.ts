import crypto from "crypto";

/**
 * Click (click.uz) "Shop API v2" (Prepare/Complete) integratsiyasi.
 * Hujjat: https://docs.click.uz — standart Prepare/Complete oqimi.
 */

export const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || "";
export const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID || "";
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || "";

export const CLICK_MIN = 1_000;
export const CLICK_MAX = 10_000_000;

export const ClickError = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  WRONG_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  UPDATE_FAILED: -7,
  BAD_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
} as const;

const ERROR_NOTE: Record<number, string> = {
  [ClickError.SUCCESS]: "Success",
  [ClickError.SIGN_FAILED]: "SIGN CHECK FAILED!",
  [ClickError.WRONG_AMOUNT]: "Incorrect parameter amount",
  [ClickError.ACTION_NOT_FOUND]: "Action not found",
  [ClickError.ALREADY_PAID]: "Already paid",
  [ClickError.ORDER_NOT_FOUND]: "Order not found",
  [ClickError.TRANSACTION_NOT_FOUND]: "Transaction does not exist",
  [ClickError.UPDATE_FAILED]: "Failed to update",
  [ClickError.BAD_REQUEST]: "Error in request from Click",
  [ClickError.TRANSACTION_CANCELLED]: "Transaction cancelled",
};

export function clickErrorNote(code: number): string {
  return ERROR_NOTE[code] ?? "Error";
}

function md5(s: string): string {
  return crypto.createHash("md5").update(s).digest("hex");
}

export function verifyPrepareSign(p: {
  click_trans_id: string;
  service_id: string;
  merchant_trans_id: string;
  amount: string;
  action: string;
  sign_time: string;
  sign_string: string;
}): boolean {
  if (!CLICK_SECRET_KEY) return false;
  const expected = md5(
    `${p.click_trans_id}${p.service_id}${CLICK_SECRET_KEY}${p.merchant_trans_id}${p.amount}${p.action}${p.sign_time}`,
  );
  return expected === p.sign_string;
}

export function verifyCompleteSign(p: {
  click_trans_id: string;
  service_id: string;
  merchant_trans_id: string;
  merchant_prepare_id: string;
  amount: string;
  action: string;
  sign_time: string;
  sign_string: string;
}): boolean {
  if (!CLICK_SECRET_KEY) return false;
  const expected = md5(
    `${p.click_trans_id}${p.service_id}${CLICK_SECRET_KEY}${p.merchant_trans_id}${p.merchant_prepare_id}${p.amount}${p.action}${p.sign_time}`,
  );
  return expected === p.sign_string;
}

/** Click to'lov sahifasiga yo'naltirish havolasi. */
export function buildClickPayUrl(opts: {
  amount: number;
  transactionParam: string;
  returnUrl: string;
}): string {
  const params = new URLSearchParams({
    service_id: CLICK_SERVICE_ID,
    merchant_id: CLICK_MERCHANT_ID,
    amount: String(opts.amount),
    transaction_param: opts.transactionParam,
    return_url: opts.returnUrl,
  });
  return `https://my.click.uz/services/pay?${params.toString()}`;
}

/** Click webhook so'rovi urlencoded yoki JSON kelishi mumkin — ikkalasini ham o'qiymiz. */
export async function parseClickBody(
  req: Request,
): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await req.json().catch(() => ({}));
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data ?? {})) out[k] = String(v);
    return out;
  }
  const text = await req.text();
  const out: Record<string, string> = {};
  new URLSearchParams(text).forEach((v, k) => {
    out[k] = v;
  });
  return out;
}
