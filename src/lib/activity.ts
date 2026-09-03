import { headers } from "next/headers";

import { db } from "@/lib/db";

export type ActivityAction =
  | "AUTH_LOGIN"
  | "REGISTER"
  | "PROFILE_UPDATE"
  | "ACCOUNT_UPDATE"
  | "ORDER_CREATE"
  | "ORDER_DELETE"
  | "ORDER_CANCEL"
  | "ORDER_DELIVER"
  | "ORDER_FINALIZE"
  | "OFFER_CREATE"
  | "OFFER_ACCEPT"
  | "OFFER_REJECT"
  | "CONTRACT_SEND"
  | "CONTRACT_ACCEPT"
  | "CONTRACT_DECLINE"
  | "CONTRACT_CANCEL"
  | "REVIEW_CREATE"
  | "WALLET_TOPUP"
  | "PAYOUT_REQUEST"
  | "PAYOUT_CANCEL"
  | "COMPLAINT_CREATE"
  | "USER_BLOCK"
  | "USER_UNBLOCK";

/**
 * Foydalanuvchi harakatini jurnalga yozadi (admin panelida ko'rinadi).
 * Hech qachon xato tashlamaydi — asosiy amal buzilmasligi kerak.
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  summary: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip") ||
        null;
    } catch {
      /* headers() ba'zi kontekstda mavjud emas */
    }
    await db.activityLog.create({
      data: {
        userId,
        action,
        summary,
        meta: meta ? (meta as object) : undefined,
        ip,
      },
    });
  } catch {
    /* jurnal yozilmasa ham davom etamiz */
  }
}
