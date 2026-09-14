/**
 * Ismni serverda qisman yashiradi — chinakam to'liq ism hech qachon
 * mijozga (boshqa tayyorlovchilarga) yuborilmaydi, faqat ko'rinadigan
 * qism string sifatida ketadi. `hiddenLen` client tomonda blur effekti
 * uchun ishlatiladi (haqiqiy harflar emas, faqat uzunlik).
 */
export function maskName(raw: string): { visible: string; hiddenLen: number } {
  const name = raw.trim() || "Tayyorlovchi";
  const cut = Math.max(1, Math.ceil(name.length / 2));
  return { visible: name.slice(0, cut), hiddenLen: Math.max(2, name.length - cut) };
}
