import { db } from "@/lib/db";
import { getSupportUserId } from "@/lib/support";
import { logToGroup, siteUrl, userLabel } from "@/lib/telegram-log";

/**
 * Chat xabarlarida saytdan tashqariga chiqishga (bevosita aloqa/to'lov
 * almashishga) urinishlarni aniqlash.
 *
 * Ikki daraja:
 *  - HARD: aniq andoza (telefon, karta, email, tashqi havola/@nik) — xabar
 *    umuman yuborilmaydi, foydalanuvchiga sabab ko'rsatiladi.
 *  - SOFT: "boshqa joydan toping" degan manoni bildiruvchi iboralar — bularni
 *    ishonchli bloklab bo'lmaydi (masalan "hisobim" so'zi saytda hamyon
 *    ma'nosida ham juda ko'p ishlatiladi), shuning uchun xabar yuboriladi,
 *    lekin admin guruhiga signal ketadi — keyin qo'lda ko'rib chiqiladi.
 */

export interface GuardResult {
  hard: string | null; // aniq sabab — xabar bloklanadi
  soft: string | null; // shubha sababi — faqat signal beriladi
}

// telefon: +998/998/0 bilan boshlanadigan yoki 9 xonali (90 123 45 67 kabi)
// O'zbek mobil operator kodlari bilan.
const UZ_MOBILE_PREFIXES =
  "9[0-9]|33|88|77|20|71|66|67|76|65|74|75|78|79";
const PHONE_RE = new RegExp(
  `(\\+?998[\\s\\-\\.]?(?:${UZ_MOBILE_PREFIXES})[\\s\\-\\.]?\\d{3}[\\s\\-\\.]?\\d{2}[\\s\\-\\.]?\\d{2})` +
    `|(\\b0(?:${UZ_MOBILE_PREFIXES})[\\s\\-\\.]?\\d{3}[\\s\\-\\.]?\\d{2}[\\s\\-\\.]?\\d{2}\\b)` +
    `|(\\b(?:${UZ_MOBILE_PREFIXES})[\\s\\-\\.]?\\d{3}[\\s\\-\\.]?\\d{2}[\\s\\-\\.]?\\d{2}\\b)`,
);

// karta: 16 xonali, 4talab guruhlangan bo'lishi mumkin
const CARD_RE = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/;

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

// tashqi havola / ijtimoiy tarmoq nik: t.me/..., @nik, wa.me/..., instagram...
const SOCIAL_RE =
  /(?:^|[\s(])@[a-z0-9_]{4,32}\b|t\.me\/\S+|wa\.me\/\S+|whatsapp\.com\/\S+|instagram\.com\/\S+|(?:^|\s)ig[:\s]@?[a-z0-9_.]{3,}/i;

const SOFT_TRIGGERS: [RegExp, string][] = [
  [/tashqari(da|dan)?\s+(gaplash|yoz|bog['’]lan)/i, "\"tashqarida gaplashaylik\" iborasi"],
  [/saytdan\s+tashqari/i, "\"saytdan tashqari\" iborasi"],
  [/to['’]g['’]ridan[\s\-]?to['’]g['’]ri\s+(yoz|gaplash|bog['’]lan)/i, "\"to'g'ridan-to'g'ri yozaylik\" iborasi"],
  [/shu\s+yerda\s+emas/i, "\"shu yerda emas\" iborasi"],
  [/(telegram|instagram|whatsapp|vatsap)(da|dan|ga)?\s+(top|yoz|qidir|izla)/i, "boshqa messenjerga yo'naltirish"],
  [/(meni|meniki|o['’]zimni)\s+.{0,20}(top|qidir|izla)/i, "\"meni ... dan toping\" iborasi"],
  [/nikn?eym|username|foydalanuvchi\s+nomim/i, "nik/username so'ralishi"],
  [/shaxsiy\s+(raqam|nomer|kontakt)/i, "shaxsiy kontakt so'ralishi"],
  [/bu\s+mening\s+(hisobim|nikim|profilim|akkountim|akauntim)\b/i, "\"bu mening hisobim/nikim\" iborasi — ortidan kelgan so'z tashqi identifikator bo'lishi mumkin"],
  [/mening\s+(hisobim|nikim|profilim)\s*[:\-]/i, "\"mening hisobim: ...\" formatidagi identifikator ulashish"],
];

// raqamdan keyin "so'm/sum" kabi valyuta belgisi kelsa — bu byudjet/narx,
// telefon emas (soxta signal bo'lmasligi uchun).
function looksLikeMoney(text: string, matchIndex: number, matchLen: number): boolean {
  const after = text.slice(matchIndex + matchLen, matchIndex + matchLen + 12).trim();
  return /^(so['’]m|sum|som|uzs)\b/i.test(after);
}

export function scanMessage(body: string): GuardResult {
  const text = body || "";

  const phoneMatch = PHONE_RE.exec(text);
  if (phoneMatch && !looksLikeMoney(text, phoneMatch.index, phoneMatch[0].length)) {
    return { hard: "telefon raqami", soft: null };
  }
  const cardMatch = CARD_RE.exec(text);
  if (cardMatch && !looksLikeMoney(text, cardMatch.index, cardMatch[0].length)) {
    return { hard: "bank karta raqami", soft: null };
  }
  if (EMAIL_RE.test(text)) return { hard: "email manzili", soft: null };
  if (SOCIAL_RE.test(text)) return { hard: "tashqi ijtimoiy tarmoq/nik", soft: null };

  for (const [re, label] of SOFT_TRIGGERS) {
    if (re.test(text)) return { hard: null, soft: label };
  }

  return { hard: null, soft: null };
}

/**
 * Yozilayotgan xabarni tekshiradi. Xavfli bo'lsa (HARD) — bloklaydi, shikoyat
 * yozib qo'yadi va admin guruhiga signal beradi. Shubhali bo'lsa (SOFT) —
 * xabar yuboriladi, lekin baribir admin guruhiga signal ketadi. Ishlatilishi
 * kerak bo'lgan har bir joyda (yangi xabar, tahrirlash) chaqiriladi.
 */
export async function enforceChatGuard(opts: {
  conversationId: string;
  senderId: string;
  body: string;
}): Promise<{ blocked: true; reason: string } | { blocked: false }> {
  const result = scanMessage(opts.body);
  if (!result.hard && !result.soft) return { blocked: false };

  const sender = await db.user.findUnique({
    where: { id: opts.senderId },
    select: { login: true, name: true, firstName: true, lastName: true, email: true },
  });
  const convUrl = siteUrl(`/sardorxon/admin/chats/${opts.conversationId}`);

  if (result.hard) {
    // xabarni haqiqiy yozishmaga saqlaymiz (o'chirilgan holda) — oddiy
    // ishtirokchilarga mazmuni ko'rinmaydi (toClientMessage buni yashiradi),
    // lekin admin panelida (forAdmin) va shikoyat sahifasida to'liq ko'rinadi.
    // conversation.lastMessageAt YANGILANMAYDI — chatni suhbat ro'yxatida
    // "yangi xabor" sifatida ko'tarib yubormasligi kerak.
    const blockedMsg = await db.message.create({
      data: {
        conversationId: opts.conversationId,
        senderId: opts.senderId,
        body: opts.body,
        deletedAt: new Date(),
      },
    });

    await Promise.all([
      logToGroup(
        "moderation",
        "🚨 Xabar bloklandi (avtomatik nazorat)",
        [
          `Sabab: ${result.hard}`,
          `Yuboruvchi: ${userLabel(sender)}`,
          sender?.email ? `Email: ${sender.email}` : "",
          `Matn: ${opts.body}`,
          `Suhbat ID: ${opts.conversationId}`,
        ].filter(Boolean),
        convUrl,
      ),
      getSupportUserId()
        .then((reporterId) =>
          db.complaint.create({
            data: {
              reporterId,
              suspectId: opts.senderId,
              messageId: blockedMsg.id,
              body: `Avtomatik nazorat: xabar bloklandi (${result.hard}) va yuborilmadi.`,
            },
          }),
        )
        .catch(() => {}),
    ]);
    return {
      blocked: true,
      reason:
        `Xabar yuborilmadi: ${result.hard} aniqlandi. ` +
        `Saytdan tashqarida aloqa yoki to'lov almashish taqiqlangan — bu holat qayd etildi va admin ko'rib chiqadi.`,
    };
  }

  await logToGroup(
    "moderation",
    "⚠️ Shubhali xabar (yuborildi, tekshiring)",
    [
      `Sabab: ${result.soft}`,
      `Yuboruvchi: ${userLabel(sender)}`,
      sender?.email ? `Email: ${sender.email}` : "",
      `Matn: ${opts.body}`,
      `Suhbat ID: ${opts.conversationId}`,
    ].filter(Boolean),
    convUrl,
  );
  return { blocked: false };
}
