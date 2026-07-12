# @orchestra/ui `[S]`

Shared design system for Orchestra. **Changing this package needs a PR approved by _both_
founders** (AGENTS.md §2). Domain B seeded it (design lift on the workspace screens); domain A
must co-own it before it becomes the home for animation + decision-side components.

## What lives here
- **`icons.tsx`** — hand-drawn SVG icon set (24×24 grid, 1.75 stroke, `currentColor`). No emoji,
  no icon font. Import individual icons for tree-shaking: `import { BoltIcon } from "@orchestra/ui"`.
- **Primitives** — `Card`, `Badge`/`EstimatedTag`, `Button`/`IconButton`, `Input`/`Textarea`/`Field`,
  `EmptyState`/`ErrorState`/`Skeleton`, `StatTile`, `Meter`, `AgentAvatar`, `SegmentedControl`.

## Class-vocabulary contract
Primitives are presentational and assume the consuming app defines this Tailwind theme
(source of truth: `apps/web/tailwind.config.ts` + `apps/web/app/globals.css`). Token **values**
(and light/dark swap) stay app-side so the theme can be applied at the root; this package only
speaks the names below. Promote tokens into a `tailwind-preset` here once A co-owns it.

| Group | Classes |
| --- | --- |
| Surfaces | `bg-paper` `bg-card` `border-line` `shadow-card` `shadow-card-lg` |
| Text | `text-ink` `text-ink2` `text-muted` `text-faint` |
| Accents | `b` / `b-soft` / `b-line` / `b-deep` · `a` / `a-soft` / `a-line` · `gold` / `gold-soft` / `gold-line` |
| Semantic | `good` / `good-soft` · `bad` / `bad-soft` |
| Type | `font-sans` `font-serif` `font-mono` |

## Shipping model
Raw TS/TSX, no build step — Next transpiles it (`transpilePackages: ["@orchestra/ui"]`).
`pnpm --filter @orchestra/ui typecheck` runs `tsc --noEmit`.
