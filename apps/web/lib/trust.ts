// Trust engine (FR-11). Pure — feedback "pass"→+1, "fail"→−1, bounded 0..100.
// Source of truth for trust history is the feedback log; agents.trust is the running total.

export function trustDelta(rating: "pass" | "fail"): number {
  return rating === "pass" ? 1 : -1;
}

export function clampTrust(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function applyFeedback(current: number, rating: "pass" | "fail"): { delta: number; next: number } {
  const delta = trustDelta(rating);
  return { delta, next: clampTrust(current + delta) };
}
