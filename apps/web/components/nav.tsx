"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Command", hint: "Nhập task" },
  { href: "/board", label: "Task Board", hint: "Realtime" },
  { href: "/dashboard", label: "Performance", hint: "Người vs AI" },
  { href: "/pool", label: "Capability Pool", hint: "Người + agent" },
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Điều hướng chính"
      className="flex items-center gap-1 overflow-x-auto border-b border-line bg-card/70 px-3 py-2 backdrop-blur md:gap-2 md:px-5"
    >
      <span className="mr-2 flex items-center gap-2 font-semibold">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-b" aria-hidden />
        Orchestra
      </span>
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors",
              active ? "bg-b-soft text-b font-semibold" : "text-ink2 hover:bg-line/60",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </nav>
  );
}
