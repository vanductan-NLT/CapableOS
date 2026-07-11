import { CAPABILITIES, type RequiredCapability } from "@orchestra/contracts";
import { CAPABILITY_KEYWORDS } from "./keywords";
import type { PlanInput } from "./plan";

export function fallbackExtract(input: PlanInput): RequiredCapability[] {
  const text = `${input.title} ${input.description ?? ""}`;
  const hits = CAPABILITIES.filter((cap) => CAPABILITY_KEYWORDS[cap].test(text));

  if (hits.length === 0) {
    return [];
  }

  const rawWeight = 1 / hits.length;
  return hits.map((cap, index) => ({
    cap,
    weight:
      index === hits.length - 1
        ? roundWeight(1 - rawWeight * (hits.length - 1))
        : roundWeight(rawWeight),
  }));
}

function roundWeight(value: number): number {
  return Number(value.toFixed(3));
}
