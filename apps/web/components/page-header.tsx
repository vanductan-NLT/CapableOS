import type { ReactNode } from "react";
import { Reveal } from "@orchestra/ui";

type Accent = "brand" | "b" | "a" | "gold";

const EYEBROW: Record<Accent, string> = {
  brand: "text-brand-deep",
  b: "text-b-deep",
  a: "text-a",
  gold: "text-gold",
};
const DOT: Record<Accent, string> = {
  brand: "bg-brand",
  b: "bg-b",
  a: "bg-a",
  gold: "bg-gold",
};

/**
 * Editorial masthead — the repeated top note across all four workspace screens
 * (research: eyebrow → serif display H1 → one-line lead → actions). Keeps the
 * screens one family. Neutrals + type do the work; the accent lives only in the
 * mono eyebrow + its dot, so each screen has exactly one quiet colour signature.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  accent = "brand",
  actions,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  accent?: Accent;
  actions?: ReactNode;
}) {
  return (
    <Reveal>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow ? (
            <span className={`flex items-center gap-2 font-mono text-eyebrow font-medium uppercase ${EYEBROW[accent]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${DOT[accent]}`} aria-hidden />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="mt-3 text-balance font-serif text-h1 font-medium text-ink md:text-display">{title}</h1>
          {lead ? <p className="mt-4 max-w-[46ch] text-body-lg text-muted">{lead}</p> : null}
        </div>
        {actions ? <div className="flex flex-none items-center gap-2 pb-1">{actions}</div> : null}
      </header>
    </Reveal>
  );
}
