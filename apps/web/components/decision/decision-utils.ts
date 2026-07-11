// Pure utility functions for DecisionCard — no React or UI imports.
// Extracted for testability without requiring full component resolution.

import type { Verdict } from "@orchestra/contracts";

// ── Verdict → visual mapping (deterministic, testable) ──────

export type VerdictTone = "a" | "b" | "gold" | "good" | "bad" | "muted";

export interface VerdictConfig {
  label: string;
  tone: VerdictTone;
}

const VERDICT_CONFIG: Record<Verdict, VerdictConfig> = {
  ai: { label: "AI", tone: "a" },
  human: { label: "Con người", tone: "b" },
  hybrid: { label: "Kết hợp", tone: "gold" },
  escalate: { label: "Chuyển cấp", tone: "bad" },
};

/** Pure helper — maps verdict to display config. */
export function getVerdictConfig(verdict: Verdict): VerdictConfig {
  return VERDICT_CONFIG[verdict];
}

/** Format confidence/ambiguity: null → "—", number → percentage string. */
export function formatMetric(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(0)}%`;
}
