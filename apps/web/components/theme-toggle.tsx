"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { useT } from "@/lib/i18n";

export function ThemeToggle() {
  const t = useT();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t("Chuyển sang chế độ sáng", "Switch to light mode") : t("Chuyển sang chế độ tối", "Switch to dark mode")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink2 shadow-[var(--elev-1)] transition-colors hover:bg-blue-soft"
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
