/** "3 kun oldin" ko'rinishida nisbiy vaqt (o'zbekcha). */
export function timeAgo(input: Date | string | number): string {
  const then = new Date(input).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (secs < 60) return "hozirgina";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} kun oldin`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} hafta oldin`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} oy oldin`;
  const years = Math.floor(days / 365);
  return `${years} yil oldin`;
}
