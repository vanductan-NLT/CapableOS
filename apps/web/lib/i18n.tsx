"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Lightweight bilingual layer (VI default / EN toggle). Strings live next to their
 * usage via the t(vi, en) helper — no giant dictionary to drift out of sync. The
 * choice persists to localStorage. Default is "vi" on both server and first client
 * render, so there is no hydration mismatch; a stored "en" applies after mount.
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
      // localStorage unavailable — keep default
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
    document.documentElement.lang = l;
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/**
 * Translate helper: `const t = useT(); t("Giao việc", "Assign work")`.
 * Returns the active-language string. VI first (product's primary language).
 */
export function useT() {
  const { lang } = useLang();
  return (vi: string, en: string) => (lang === "en" ? en : vi);
}
