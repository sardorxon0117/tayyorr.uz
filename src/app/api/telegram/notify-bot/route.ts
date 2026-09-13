import { NextResponse } from "next/server";

import { handleIncomingMessage } from "@/lib/telegram-link";

const WEBHOOK_SECRET = process.env.TELEGRAM_NOTIFY_WEBHOOK_SECRET;

interface TgUpdate {
  message?: {
    chat?: { id?: number };
    from?: { first_name?: string; username?: string };
    text?: string;
  };
}

/** Telegram shaxsiy bildirishnoma botining webhook manzili (akkaunt ulash oqimini boshqaradi). */
export async function POST(req: Request) {
  if (WEBHOOK_SECRET) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text?.trim();

  if (chatId && text) {
    await handleIncomingMessage(chatId, text, {
      first_name: msg?.from?.first_name,
      username: msg?.from?.username,
    }).catch(() => {});
  }

  // Telegramga har doim 200 qaytaramiz — aks holda qayta-qayta jo'natishga urinadi
  return NextResponse.json({ ok: true });
}
