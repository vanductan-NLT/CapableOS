"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Lightweight bilingual layer (VI default / EN toggle). Strings live next to their
 * usage via the t(vi, en) helper. Choice persists to localStorage. Default "vi" on
 * server + first client render → no hydration mismatch; stored "en" applies on mount.
 */
export type Lang = "vi" | "en";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "vi",
  setLang: () => {},
});

const STORAGE_KEY = "orch-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "vi") setLangState(saved);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** t("Giao việc", "Assign work") → active-language string. */
export function useT() {
  const { lang } = useLang();
  return (vi: string, en: string) => (lang === "en" ? en : vi);
}
