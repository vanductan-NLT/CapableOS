"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BoardIcon,
  BrandMark,
  CommandIcon,
  DashboardIcon,
  PoolIcon,
  cn,
  spring,
  type IconProps,
} from "@orchestra/ui";
import { useLang, useT } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";

const LINKS: {
  href: "/" | "/board" | "/dashboard" | "/pool";
  vi: string;
  en: string;
  icon: ComponentType<IconProps>;
}[] = [
  { href: "/", vi: "Giao việc", en: "Assign", icon: CommandIcon },
  { href: "/board", vi: "Bảng việc", en: "Board", icon: BoardIcon },
  { href: "/dashboard", vi: "Năng suất", en: "Performance", icon: DashboardIcon },
  { href: "/pool", vi: "Năng lực", en: "Capability", icon: PoolIcon },
];

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Ngôn ngữ / Language"
      className="flex items-center rounded-full border border-line bg-card p-0.5"
    >
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
            lang === l ? "bg-brand text-white" : "text-muted hover:text-ink",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Nav() {
  const path = usePathname();
  const reduce = useReducedMotion();
  const t = useT();
  return (
    <nav
      aria-label={t("Điều hướng chính", "Main navigation")}
      className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-line bg-card/85 px-3 py-2 backdrop-blur-md md:gap-1.5 md:px-5"
    >
      <Link href="/" className="mr-3 flex flex-none items-center gap-2.5 pr-1 text-ink">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-grad-brand text-white shadow-glow-brand">
          <BrandMark size={18} title="Orchestra" />
        </span>
        <span className="hidden font-serif text-lg font-semibold tracking-tight sm:inline">Orchestra</span>
      </Link>
      {LINKS.map(({ href, vi, en, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-11 flex-none items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors",
              active ? "font-semibold text-brand-deep" : "text-ink2 hover:bg-brand-soft hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                aria-hidden
                className="absolute inset-0 -z-0 rounded-full bg-brand-soft ring-1 ring-inset ring-brand-line"
                transition={reduce ? { duration: 0 } : spring.layout}
              />
            ) : null}
            <Icon size={16} className={cn("relative z-10", active ? "text-brand" : "text-muted")} />
            <span className="relative z-10 hidden md:inline">{t(vi, en)}</span>
          </Link>
        );
      })}
      <div className="ml-auto flex flex-none items-center gap-1.5 pl-1">
        <LangToggle />
        <ThemeToggle />
      </div>
    </nav>
  );
}
