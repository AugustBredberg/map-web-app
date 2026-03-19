"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { createT, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "locale";
const DEFAULT_LOCALE: Locale = "sv";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "sv" ? stored : DEFAULT_LOCALE;
  });

  const setLocale = useCallback((loc: Locale) => {
    localStorage.setItem(STORAGE_KEY, loc);
    setLocaleState(loc);
  }, []);

  const t = useMemo(() => createT(locale), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
