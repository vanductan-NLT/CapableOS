"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";

export function ThemeToggle() {
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
      aria-label={dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink2 shadow-[var(--elev-1)] transition-colors hover:bg-blue-soft"
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
