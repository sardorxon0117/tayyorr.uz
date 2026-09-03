import { cookies } from "next/headers";

import { translate, type Locale } from "@/lib/i18n";

/** Server komponentlarда joriy til (cookie'дан). */
export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("tyr_locale")?.value;
  return v === "ru" || v === "en" ? v : "uz";
}

/** Server komponentlarда tarjima funksiyasi. */
export async function getT(): Promise<(key: string) => string> {
  const locale = await getLocale();
  return (key: string) => translate(locale, key);
}

/** uz/ru/en matnlaridan mos tilnitni tanlaydi (uz — zaxira). */
export function pickLocale(
  locale: Locale,
  uz: string,
  ru?: string | null,
  en?: string | null,
): string {
  if (locale === "ru") return ru?.trim() || uz;
  if (locale === "en") return en?.trim() || uz;
  return uz;
}
