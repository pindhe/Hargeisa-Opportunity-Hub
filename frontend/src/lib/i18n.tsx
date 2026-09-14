"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, so, type Locale, type MessageKey } from "./messages";

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}>({
  locale: "en",
  setLocale: () => undefined,
  t: (key) => en[key],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("hoh-locale");
    if (stored === "so" || stored === "en") setLocaleState(stored);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("hoh-locale", next);
    document.documentElement.lang = next;
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey) => (locale === "so" ? so : en)[key],
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
