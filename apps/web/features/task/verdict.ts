import type { DecisionResponse } from "@orchestra/contracts";
import type { Lang } from "@/lib/i18n";

type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";
type Verdict = DecisionResponse["verdict"];

/**
 * Human-language layer (gate /sonle + /nhi: "sản phẩm tốt không cần giải thích").
 * The pipeline speaks in dev tokens (verdict "ai", confidence 0.92) — the UI must
 * speak a COO's words, in the active language. Bilingual VI/EN.
 */

const VERDICT: Record<Verdict, { vi: { label: string; who: string }; en: { label: string; who: string }; tone: Tone }> = {
  ai: { vi: { label: "Giao cho AI", who: "AI làm" }, en: { label: "Assigned to AI", who: "AI" }, tone: "a" },
  human: { vi: { label: "Giao cho người", who: "Người làm" }, en: { label: "Assigned to a person", who: "Human" }, tone: "b" },
  hybrid: { vi: { label: "Người + AI", who: "Cùng làm" }, en: { label: "Human + AI", who: "Together" }, tone: "gold" },
  escalate: { vi: { label: "Cần bạn quyết", who: "Chờ bạn" }, en: { label: "Needs your call", who: "You" }, tone: "bad" },
};

export function verdictTone(v: Verdict): Tone {
  return VERDICT[v].tone;
}
export function verdictLabel(v: Verdict, lang: Lang = "vi"): string {
  return VERDICT[v][lang].label;
}
export function verdictWho(v: Verdict, lang: Lang = "vi"): string {
  return VERDICT[v][lang].who;
}

/** Backward-compatible VI map (tone + labels) — existing callers keep working. */
export const VERDICT_META: Record<Verdict, { label: string; who: string; tone: Tone }> = {
  ai: { label: VERDICT.ai.vi.label, who: VERDICT.ai.vi.who, tone: VERDICT.ai.tone },
  human: { label: VERDICT.human.vi.label, who: VERDICT.human.vi.who, tone: VERDICT.human.tone },
  hybrid: { label: VERDICT.hybrid.vi.label, who: VERDICT.hybrid.vi.who, tone: VERDICT.hybrid.tone },
  escalate: { label: VERDICT.escalate.vi.label, who: VERDICT.escalate.vi.who, tone: VERDICT.escalate.tone },
};

/** Confidence → a phrase a human trusts, not a raw percentage. */
export function confidencePhrase(c: number | null | undefined, lang: Lang = "vi"): string {
  const v = c ?? 0;
  if (lang === "en") {
    if (v >= 0.85) return "almost certain";
    if (v >= 0.7) return "fairly confident";
    if (v >= 0.5) return "moderately sure";
    return "needs review";
  }
  if (v >= 0.85) return "gần như chắc chắn";
  if (v >= 0.7) return "khá chắc chắn";
  if (v >= 0.5) return "tương đối chắc";
  return "cần cân nhắc";
}

/** Risk → plain language. */
export function riskPhrase(risk: string | null | undefined, lang: Lang = "vi"): string {
  const r = (risk ?? "").toLowerCase();
  const map: Record<string, { vi: string; en: string }> = {
    low: { vi: "Rủi ro thấp", en: "Low risk" },
    medium: { vi: "Rủi ro vừa", en: "Medium risk" },
    high: { vi: "Rủi ro cao", en: "High risk" },
  };
  if (r in map) return map[r]![lang];
  if (risk) return lang === "en" ? `Risk: ${risk}` : `Rủi ro: ${risk}`;
  return lang === "en" ? "Risk unknown" : "Rủi ro chưa rõ";
}
