"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Giao việc", icon: "command", exact: true },
  { href: "/board", label: "Luồng xử lý", icon: "board" },
  { href: "/pool", label: "Người & AI", icon: "workforce" },
  { href: "/governance", label: "Phê duyệt", icon: "governance" },
  { href: "/dashboard", label: "Hiệu quả", icon: "insights" },
  { href: "/my-work", label: "Việc của tôi", icon: "inbox" },
];

function isActive(item: NavItem, path: string): boolean {
  return item.exact ? path === item.href : path.startsWith(item.href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const current = NAV.find((n) => isActive(n, path));

  return (
    <div className="app-atmosphere flex min-h-dvh">
      {/* Sidebar: icon rail → labels at ≥xl */}
      <aside className="sticky top-0 z-30 flex h-dvh w-[68px] flex-col border-r border-line bg-[color:var(--blue-soft)]/70 backdrop-blur-xl xl:w-64">
        <div className="flex h-16 items-center gap-3 border-b border-line px-3 xl:px-5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--grad-hero)] text-white shadow-[var(--elev-2)]"
            aria-hidden
          >
            <Icon name="users" size={18} />
          </span>
          <span className="hidden text-base font-bold tracking-[-0.01em] text-ink xl:inline">Human-AgentOS</span>
        </div>

        <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-2 p-3">
          {NAV.map((item) => {
            const active = isActive(item, path);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={clsx(
                  "flex items-center gap-3 rounded-full px-3 py-3 text-sm font-semibold transition-colors xl:px-4",
                  active
                    ? "bg-card text-blue shadow-[var(--elev-1)]"
                    : "text-ink2 hover:bg-card/70",
                )}
              >
                <Icon name={item.icon} size={20} label={item.label} />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-line p-4 text-[12px] leading-5 text-muted xl:block">
          Quyết định ai làm việc, kiểm soát rủi ro, đo hiệu quả.
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-card/80 px-4 backdrop-blur-xl md:px-8">
          <h1 className="truncate text-base font-bold text-ink">{current?.label ?? "Human-AgentOS"}</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[image:var(--grad-cta)] px-5 text-sm font-bold text-white shadow-[var(--elev-1)] transition-[filter] hover:brightness-105 [touch-action:manipulation]"
            >
              <Icon name="sparkles" size={16} />
              <span className="hidden sm:inline">Tạo yêu cầu</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
