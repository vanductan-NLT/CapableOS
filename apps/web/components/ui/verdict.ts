import type { Verdict } from "@orchestra/contracts";
import type { IconName } from "./icon";

export type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";

// Single source for how each routing verdict is presented to the user.
// Colors reuse the existing token palette (a=AI/purple, b=human/teal,
// gold=hybrid, bad=escalate) — see tailwind.config.ts.

export interface VerdictPresentation {
  /** Short chip label. */
  label: string;
  /** Full plain-language headline for the decision hero. */
  headline: string;
  tone: Tone;
  icon: IconName;
  /** Raw accent hex for stripes / avatars. */
  hex: string;
}

export const VERDICT_PRESENTATION: Record<Verdict, VerdictPresentation> = {
  ai: { label: "AI", headline: "Đề xuất giao cho AI", tone: "a", icon: "bot", hex: "#5A4BD4" },
  human: { label: "Con người", headline: "Đề xuất giao cho người", tone: "b", icon: "user", hex: "#0E9C8B" },
  hybrid: { label: "Người + AI", headline: "Đề xuất đội Người + AI", tone: "gold", icon: "users", hex: "#B27916" },
  escalate: { label: "Chuyển cấp", headline: "Cần quản lý xem xét", tone: "bad", icon: "alert", hex: "#BB4C3B" },
};

/** Map a candidate/agent type to its presentation (icon + accent). */
export function agentTypeMeta(type: "human" | "ai"): { icon: IconName; tone: Tone; hex: string; label: string } {
  return type === "ai"
    ? { icon: "bot", tone: "a", hex: "#5A4BD4", label: "AI" }
    : { icon: "user", tone: "b", hex: "#0E9C8B", label: "Người" };
}

/** Human-friendly confidence band from a 0..1 score. */
export function confidenceLabel(value: number | null): string {
  if (value === null) return "—";
  if (value >= 0.85) return "Rất cao";
  if (value >= 0.7) return "Cao";
  if (value >= 0.5) return "Vừa";
  return "Thấp";
}

/** Whether the top two candidates are close (ambiguity = fit#1 − fit#2). */
export function isCloseCall(ambiguity: number | null): boolean {
  return ambiguity !== null && ambiguity < 0.08;
}
