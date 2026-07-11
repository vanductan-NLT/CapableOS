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
import { ThemeToggle } from "./theme-toggle";

const LINKS: { href: "/" | "/board" | "/dashboard" | "/pool"; label: string; icon: ComponentType<IconProps> }[] = [
  { href: "/", label: "Command", icon: CommandIcon },
  { href: "/board", label: "Task Board", icon: BoardIcon },
  { href: "/dashboard", label: "Performance", icon: DashboardIcon },
  { href: "/pool", label: "Capability Pool", icon: PoolIcon },
];

export function Nav() {
  const path = usePathname();
  const reduce = useReducedMotion();
  return (
    <nav
      aria-label="Điều hướng chính"
      className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-line bg-card/80 px-3 py-2.5 backdrop-blur-md md:gap-1.5 md:px-5"
    >
      <Link href="/" className="mr-2 flex flex-none items-center gap-2.5 pr-1 text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-grad-brand text-white shadow-glow-b">
          <BrandMark size={19} title="Orchestra" />
        </span>
        <span className="hidden font-semibold tracking-tight sm:inline">Orchestra</span>
      </Link>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-none items-center gap-2 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm transition-colors",
              active ? "font-semibold text-b-deep" : "text-ink2 hover:bg-line/60 hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                aria-hidden
                className="absolute inset-0 -z-0 rounded-xl bg-b-soft ring-1 ring-inset ring-b-line"
                transition={reduce ? { duration: 0 } : spring.layout}
              />
            ) : null}
            <Icon size={16} className={cn("relative z-10", active ? "text-b" : "text-muted")} />
            <span className="relative z-10 hidden md:inline">{label}</span>
          </Link>
        );
      })}
      <div className="ml-auto flex-none pl-1">
        <ThemeToggle />
      </div>
    </nav>
  );
}
