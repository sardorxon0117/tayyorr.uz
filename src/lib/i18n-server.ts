import { translate, type Locale } from "@/lib/i18n";

// v1 — faqat o'zbekcha. Boshqa tillar v2 da.
export async function getLocale(): Promise<Locale> {
  return "uz";
}

export async function getT(): Promise<(key: string) => string> {
  return (key: string) => translate("uz", key);
}

export function pickLocale(
  _locale: Locale,
  uz: string,
  _ru?: string | null,
  _en?: string | null,
): string {
  return uz;
}
