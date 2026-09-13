import crypto from "crypto";

import { db } from "@/lib/db";

const TOKEN = process.env.TELEGRAM_NOTIFY_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_NOTIFY_BOT_USERNAME || "tayyorr_xabarnoma_bot";
const secret = process.env.AUTH_SECRET || "dev-secret";
const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.AUTH_URL ||
  "https://tayyorr.uz"
).replace(/\/+$/, "");

function sign(data: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Foydalanuvchini botga ulash uchun shaxsiy deep-link yaratadi.
 * /start buyrug'i shu tokenni oladi, biz uni tekshirib userni topamiz.
 */
export function buildConnectDeepLink(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  return `https://t.me/${BOT_USERNAME}?start=${token}`;
}

/** /start tokenini tekshiradi, to'g'ri bo'lsa userId qaytaradi. */
export function verifyConnectToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const { uid } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof uid === "string" ? uid : null;
  } catch {
    return null;
  }
}

async function tg(method: string, body: Record<string, unknown>) {
  if (!TOKEN) return null;
  try {
    return await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface TelegramNotifyPayload {
  title: string;
  body: string;
  url?: string; // saytdagi to'liq havola (masalan `${SITE}/messages/123`)
  buttonLabel?: string;
}

/**
 * Bitta foydalanuvchiga shaxsiy bildirishnoma botidan xabar yuboradi.
 * Foydalanuvchi botga ulanmagan bo'lsa — jim o'tkazib yuboriladi.
 */
export async function sendTelegramToUser(userId: string, payload: TelegramNotifyPayload) {
  if (!TOKEN) return;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true },
  });
  if (!user?.telegramChatId) return;

  const text = `<b>${esc(payload.title)}</b>\n\n${esc(payload.body)}`;
  const reply_markup = payload.url
    ? {
        inline_keyboard: [
          [{ text: payload.buttonLabel || "Ko'rish", url: payload.url }],
        ],
      }
    : undefined;

  const res = await tg("sendMessage", {
    chat_id: user.telegramChatId,
    text,
    parse_mode: "HTML",
    reply_markup,
  });

  // 403 — foydalanuvchi botni bloklagan yoki chatni o'chirgan: ulanishni tozalaymiz
  if (res && res.status === 403) {
    await db.user
      .update({ where: { id: userId }, data: { telegramChatId: null } })
      .catch(() => {});
  }
}

/** Bir nechta foydalanuvchiga bitta xabarni yuboradi (parallel). */
export async function sendTelegramToUsers(
  userIds: string[],
  payload: TelegramNotifyPayload,
) {
  await Promise.all(userIds.map((id) => sendTelegramToUser(id, payload)));
}

export function siteUrl(path: string): string {
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** /start buyrug'ini qayta ishlaydi: userni bog'laydi va salomlashadi. */
export async function handleStartCommand(chatId: number, token: string, firstNameFromTg?: string) {
  const userId = verifyConnectToken(token);
  if (!userId) {
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        "Ulanish havolasi noto'g'ri yoki eskirgan. Iltimos, saytdan \"Bog'lanish\" tugmasini qayta bosing.",
    });
    return;
  }

  const user = await db.user
    .update({
      where: { id: userId },
      data: { telegramChatId: String(chatId), telegramLinkedAt: new Date() },
      select: { name: true, firstName: true, login: true },
    })
    .catch(() => null);

  if (!user) {
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        "Ulanish havolasi noto'g'ri yoki eskirgan. Iltimos, saytdan \"Bog'lanish\" tugmasini qayta bosing.",
    });
    return;
  }

  const displayName =
    user.firstName || user.name || firstNameFromTg || (user.login ? `@${user.login}` : "");

  await tg("sendMessage", {
    chat_id: chatId,
    text:
      `Salom${displayName ? `, ${esc(displayName)}` : ""}! 👋\n\n` +
      "Endi tayyorr.uz'dagi yangi xabarlar, takliflar, shartnomalar va to'lovlar haqidagi " +
      "bildirishnomalarni shu yerdan ham bilib borasiz.",
  });
}
