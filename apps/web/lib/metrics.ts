// Metrics engine (FR-12). Pure functions over already-fetched rows → unit-testable.
// Routes fetch from Supabase and shape rows into these inputs.

import type { AllocationSplit, Metrics, Verdict } from "@orchestra/contracts";

export function emptySplit(): AllocationSplit {
  return { human: 0, ai: 0, hybrid: 0, escalate: 0 };
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface MetricsInput {
  decisions: { verdict: Verdict }[];
  executions: { ms: number | null; cost: number | null }[];
  feedback: { rating: "pass" | "fail" }[];
  /** ESTIMATED baseline cost of doing one automated task fully by a human. */
  humanBaselineCost?: number;
}

export function computeMetrics(inp: MetricsInput): Metrics {
  const split = emptySplit();
  for (const d of inp.decisions) split[d.verdict] += 1;

  const totalDecisions = inp.decisions.length;
  const automated = split.ai + split.hybrid;
  const automation = totalDecisions ? automated / totalDecisions : 0;

  const msVals = inp.executions.map((e) => e.ms).filter((x): x is number => x != null);
  const avg_ms = Math.round(mean(msVals));

  const passes = inp.feedback.filter((f) => f.rating === "pass").length;
  const quality = inp.feedback.length ? passes / inp.feedback.length : 0;

  const baseline = inp.humanBaselineCost ?? 0;
  const actualCost = inp.executions.reduce((a, e) => a + (e.cost ?? 0), 0);
  const cost_saving = Math.max(0, automated * baseline - actualCost);

  return { automation, cost_saving, avg_ms, split, quality };
}

// ── Human vs AI breakdown (additive, B-owned; dashboard table) ──────────────
export interface TaskRecord {
  side: "human" | "ai" | null; // from assignee agent type
  minutes: number | null; // human: agent est; ai: execution ms→minutes
  cost: number | null; // human: agent est; ai: execution real
  rating: "pass" | "fail" | null; // latest feedback
  estimated: boolean; // human rows are ESTIMATED
}

export interface SideStat {
  tasks: number;
  avgMinutes: number;
  totalCost: number;
  quality: number; // 0..1, NaN-safe (0 when no feedback)
  feedbackCount: number;
  estimated: boolean;
}

function sideStat(records: TaskRecord[]): SideStat {
  const minutes = records.map((r) => r.minutes).filter((x): x is number => x != null);
  const costs = records.map((r) => r.cost).filter((x): x is number => x != null);
  const ratings = records.map((r) => r.rating).filter((x): x is "pass" | "fail" => x != null);
  const passes = ratings.filter((r) => r === "pass").length;
  return {
    tasks: records.length,
    avgMinutes: Math.round(mean(minutes)),
    totalCost: Number(costs.reduce((a, b) => a + b, 0).toFixed(2)),
    quality: ratings.length ? passes / ratings.length : 0,
    feedbackCount: ratings.length,
    estimated: records.some((r) => r.estimated),
  };
}

export function computeBreakdown(records: TaskRecord[]): { human: SideStat; ai: SideStat } {
  return {
    human: sideStat(records.filter((r) => r.side === "human")),
    ai: sideStat(records.filter((r) => r.side === "ai")),
  };
}

// ── Flow metrics (DORA-style: lead time + throughput) ───────────────────────
// Research: objective delivery signals from data alone. Lead time = created→done;
// throughput = completed per window. P50 (median) resists outliers better than mean.
const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
};

export interface DoneEvent {
  leadMs: number; // done_at − created_at
  doneAt: number; // epoch ms
}

export interface Flow {
  completed: number;
  leadTimeMsP50: number;
  leadTimeMsAvg: number;
  throughput: number; // completed within the window
  windowDays: number;
}

export function computeFlow(events: DoneEvent[], nowMs: number, windowDays = 7): Flow {
  const leads = events.map((e) => e.leadMs).filter((x) => Number.isFinite(x) && x >= 0);
  const since = nowMs - windowDays * 86_400_000;
  return {
    completed: events.length,
    leadTimeMsP50: median(leads),
    leadTimeMsAvg: Math.round(mean(leads)),
    throughput: events.filter((e) => e.doneAt >= since).length,
    windowDays,
  };
}
