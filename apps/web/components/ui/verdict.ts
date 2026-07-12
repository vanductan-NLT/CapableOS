import type { Verdict } from "@orchestra/contracts";
import type { IconName } from "./icon";

export type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";

// Single source for how each routing verdict is presented to the user.
// Colors reuse the existing token palette (a=AI/purple, b=human/teal,
// gold=hybrid, bad=escalate) — see tailwind.config.ts.

/** A bilingual string resolved at render time via useT(). */
export interface Bilingual {
  vi: string;
  en: string;
}

export interface VerdictPresentation {
  /** Short chip label. */
  label: Bilingual;
  /** Full plain-language headline for the decision hero. */
  headline: Bilingual;
  tone: Tone;
  icon: IconName;
  /** Raw accent hex for stripes / avatars. */
  hex: string;
}

export const VERDICT_PRESENTATION: Record<Verdict, VerdictPresentation> = {
  ai: { label: { vi: "AI", en: "AI" }, headline: { vi: "Đề xuất giao cho AI", en: "Recommend assigning to AI" }, tone: "a", icon: "bot", hex: "#5A4BD4" },
  human: { label: { vi: "Con người", en: "Human" }, headline: { vi: "Đề xuất giao cho người", en: "Recommend assigning to a person" }, tone: "b", icon: "user", hex: "#0E9C8B" },
  hybrid: { label: { vi: "Người + AI", en: "Human + AI" }, headline: { vi: "Đề xuất đội Người + AI", en: "Recommend a Human + AI team" }, tone: "gold", icon: "users", hex: "#B27916" },
  escalate: { label: { vi: "Chuyển cấp", en: "Escalate" }, headline: { vi: "Cần quản lý xem xét", en: "Needs manager review" }, tone: "bad", icon: "alert", hex: "#BB4C3B" },
};

/** Map a candidate/agent type to its presentation (icon + accent). */
export function agentTypeMeta(type: "human" | "ai"): { icon: IconName; tone: Tone; hex: string; label: Bilingual } {
  return type === "ai"
    ? { icon: "bot", tone: "a", hex: "#5A4BD4", label: { vi: "AI", en: "AI" } }
    : { icon: "user", tone: "b", hex: "#0E9C8B", label: { vi: "Người", en: "Human" } };
}

/** Human-friendly confidence band from a 0..1 score. */
export function confidenceLabel(value: number | null, t: (vi: string, en: string) => string): string {
  if (value === null) return "—";
  if (value >= 0.85) return t("Rất cao", "Very high");
  if (value >= 0.7) return t("Cao", "High");
  if (value >= 0.5) return t("Vừa", "Medium");
  return t("Thấp", "Low");
}

/** Whether the top two candidates are close (ambiguity = fit#1 − fit#2). */
export function isCloseCall(ambiguity: number | null): boolean {
  return ambiguity !== null && ambiguity < 0.08;
}
