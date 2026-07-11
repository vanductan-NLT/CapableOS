"use client";

import { useEffect, useState } from "react";
import { IconButton, MoonIcon, SunIcon } from "@orchestra/ui";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
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
    <IconButton
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-label={dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={dark ? "Chế độ sáng" : "Chế độ tối"}
    >
      {/* render-stable icon until mounted to avoid hydration mismatch */}
      {mounted && dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </IconButton>
  );
}
