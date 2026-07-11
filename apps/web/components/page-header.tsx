import type { ReactNode } from "react";
import { Reveal } from "@orchestra/ui";

/**
 * Editorial page header shared across the workspace screens: a mono eyebrow, a
 * serif title (the report's voice), a lead line, and a gradient icon chip +
 * trailing actions. Reveals on mount. Keeps the four screens of one family.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Reveal>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {icon ? (
            <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-grad-b text-white shadow-glow-b">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-b-deep">
                {eyebrow}
              </span>
            ) : null}
            <h1 className="mt-1 font-serif text-3xl font-medium leading-tight tracking-[-0.01em] text-ink md:text-[34px]">
              {title}
            </h1>
            {lead ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted md:text-[15px]">{lead}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-none items-center gap-2">{actions}</div> : null}
      </header>
    </Reveal>
  );
}
