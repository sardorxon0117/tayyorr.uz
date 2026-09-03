const MONTHS_UZ = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
];

/** "3-mar" (joriy yildan boshqasi bo'lsa yil bilan). */
export function shortDate(input: Date | string | number): string {
  const d = new Date(input);
  const s = `${d.getDate()}-${MONTHS_UZ[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear()
    ? s
    : `${s} ${d.getFullYear()}`;
}

function hm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function isToday(d: Date) {
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

/** "3-mar, 14:20" */
export function shortDateTime(input: Date | string | number): string {
  return `${shortDate(input)}, ${hm(new Date(input))}`;
}

/** Bugun bo'lsa — faqat "14:20"; boshqa kun bo'lsa — "3-mar 14:20". */
export function smartTime(input: Date | string | number): string {
  const d = new Date(input);
  return isToday(d) ? hm(d) : `${shortDate(d)} ${hm(d)}`;
}

/** Bugun bo'lsa — "14:20"; boshqa kun — "3-mar". */
export function smartDate(input: Date | string | number): string {
  const d = new Date(input);
  return isToday(d) ? hm(d) : shortDate(d);
}
