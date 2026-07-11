// Reputation engine (strengthens FR-11) — pure, computed from the immutable feedback log.
//
// WHY (research): a naive ±1 counter lets "1 pass = 100%" outrank "48/50 passes", and never
// forgets an old failure. Proven systems use confidence-aware scores:
//   • Wilson lower bound  — penalises small samples (Reddit/Stack Overflow ranking).
//   • Bayesian average    — pulls sparse-data agents toward a global prior (IMDB Top-250).
//   • EWMA time-decay     — recent behaviour weighs more; enables recovery over time.
//
// IMPORTANT: this does NOT replace `agents.trust` (0..100) that domain A's Router reads in
// `fit = 0.7*match + 0.3*trust`. Reputation is an ADDITIVE B-side view over the feedback log.

export interface FeedbackEvent {
  rating: "pass" | "fail";
  at: number; // epoch ms (created_at)
}

export type Trend = "up" | "down" | "flat";

export interface Reputation {
  n: number; // number of ratings
  passes: number;
  raw: number; // passes/n (0 when n=0)
  wilson: number; // Wilson lower bound of pass-rate (0..1) — the headline "verified" score
  bayesian: number; // Bayesian average pulled toward prior
  ewma: number; // time-ordered EWMA (0..1) — recent-weighted
  trend: Trend; // recent vs older behaviour
}

const PRIOR_MEAN = 0.7; // global prior pass-rate for a fresh agent
const PRIOR_WEIGHT = 5; // Bayesian confidence: ~5 virtual prior ratings
const EWMA_ALPHA = 0.35; // recency weight per event

/** Wilson score lower bound for a binomial proportion (z=1.96 → 95%). */
export function wilsonLower(pos: number, n: number, z = 1.96): number {
  if (n <= 0) return 0;
  const phat = pos / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = phat + z2 / (2 * n);
  const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * n)) / n);
  return Math.max(0, Math.min(1, (centre - margin) / denom));
}

function ewma(values: number[]): number {
  if (values.length === 0) return PRIOR_MEAN;
  let acc = PRIOR_MEAN;
  for (const v of values) acc = EWMA_ALPHA * v + (1 - EWMA_ALPHA) * acc;
  return acc;
}

function trendOf(bits: number[]): Trend {
  if (bits.length < 4) return "flat";
  const k = Math.max(2, Math.floor(bits.length / 3));
  const recent = bits.slice(-k);
  const older = bits.slice(0, k);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const diff = mean(recent) - mean(older);
  if (diff > 0.1) return "up";
  if (diff < -0.1) return "down";
  return "flat";
}

/** Aggregate a single agent's feedback events into a Reputation. Events in any order. */
export function computeReputation(events: FeedbackEvent[]): Reputation {
  const ordered = [...events].sort((a, b) => a.at - b.at);
  const bits: number[] = ordered.map((e) => (e.rating === "pass" ? 1 : 0));
  const n = bits.length;
  const passes = bits.reduce((a, b) => a + b, 0);
  return {
    n,
    passes,
    raw: n ? passes / n : 0,
    wilson: wilsonLower(passes, n),
    bayesian: (PRIOR_WEIGHT * PRIOR_MEAN + passes) / (PRIOR_WEIGHT + n),
    ewma: ewma(bits),
    trend: trendOf(bits),
  };
}
