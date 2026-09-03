"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { translate, type Locale } from "@/lib/i18n";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LocaleCtx = createContext<Ctx>({
  locale: "uz",
  setLocale: () => {},
  t: (k) => translate("uz", k),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLoc] = useState<Locale>("uz");

  useEffect(() => {
    try {
      const s = localStorage.getItem("tyr_locale") as Locale | null;
      if (s === "uz" || s === "ru" || s === "en") setLoc(s);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLoc(l);
    try {
      localStorage.setItem("tyr_locale", l);
    } catch {
      /* ignore */
    }
    document.cookie = `tyr_locale=${l};path=/;max-age=31536000`;
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export const useLocale = () => useContext(LocaleCtx);
