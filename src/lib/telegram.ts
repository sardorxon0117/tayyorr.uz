const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL = process.env.TELEGRAM_CHANNEL_ID; // "@tayyorruz_works" yoki "-100..."
const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.AUTH_URL ||
  "https://tayyorr.uz"
).replace(/\/+$/, "");

const TYPE_LABEL: Record<string, string> = {
  PRESENTATION: "Prezentatsiya",
  COURSE_WORK: "Kurs ishi",
  REFERAT: "Referat",
  ESSAY: "Esse",
  DIPLOMA: "Diplom ishi",
  OTHER: "Boshqa",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("uz", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface ChannelOrder {
  id: string;
  title: string;
  type: string;
  description: string;
  budget: number | null;
  deadline: Date | null;
  createdAt: Date;
}

/**
 * Yangi buyurtmani Telegram kanalga chiroyli qilib joylaydi.
 * Hech qachon xato tashlamaydi — sayt ishiga xalaqit bermaydi.
 */
export async function postOrderToChannel(order: ChannelOrder): Promise<void> {
  if (!TOKEN || !CHANNEL) return;

  try {
    const lines: string[] = [
      "🆕 <b>Yangi buyurtma</b>",
      "",
      `<b>${esc(clip(order.title, 200))}</b>`,
      "",
      `📂 <b>Turi:</b> ${esc(TYPE_LABEL[order.type] ?? order.type)}`,
      order.budget
        ? `💰 <b>Byudjet:</b> ${order.budget.toLocaleString("ru-RU")} so'm`
        : "💰 <b>Byudjet:</b> kelishilgan holda",
    ];
    if (order.deadline) {
      lines.push(`🗓 <b>Muddat:</b> ${esc(fmtDate(order.deadline))}`);
    }
    lines.push(
      "",
      "📝 <b>Tavsif:</b>",
      esc(clip(order.description, 2500)),
      "",
      "— <i>tayyorr.uz</i>",
    );

    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHANNEL,
          text: lines.join("\n"),
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [{ text: "👁 Ishni ko'rish", url: `${SITE}/orders/${order.id}` }],
            ],
          },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendMessage failed", res.status, body.slice(0, 300));
    }
  } catch (e) {
    console.error("[telegram] post error", e instanceof Error ? e.message : e);
  }
}
