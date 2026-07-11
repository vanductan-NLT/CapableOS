import type { Risk } from "@orchestra/contracts";
import { RISK_KEYWORDS } from "./keywords";
import type { PlanInput } from "./plan";

export function classifyRisk(input: PlanInput): Risk {
  const text = `${input.title} ${input.description ?? ""}`;
  return Object.values(RISK_KEYWORDS).some((pattern) => pattern.test(text))
    ? "high"
    : "low";
}
