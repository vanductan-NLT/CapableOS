import { describe, expect, it } from "vitest";
import { computeBreakdown, computeFlow, computeMetrics, emptySplit, type DoneEvent, type TaskRecord } from "./metrics";

describe("computeMetrics", () => {
  it("empty inputs → all zero, empty split", () => {
    const m = computeMetrics({ decisions: [], executions: [], feedback: [] });
    expect(m).toEqual({ automation: 0, cost_saving: 0, avg_ms: 0, split: emptySplit(), quality: 0 });
  });

  it("automation = (ai+hybrid)/total; split counts verdicts", () => {
    const m = computeMetrics({
      decisions: [{ verdict: "ai" }, { verdict: "ai" }, { verdict: "hybrid" }, { verdict: "human" }],
      executions: [],
      feedback: [],
    });
    expect(m.split).toEqual({ human: 1, ai: 2, hybrid: 1, escalate: 0 });
    expect(m.automation).toBeCloseTo(3 / 4);
  });

  it("avg_ms averages non-null execution ms; quality = pass ratio", () => {
    const m = computeMetrics({
      decisions: [{ verdict: "ai" }],
      executions: [{ ms: 1000, cost: 0.2 }, { ms: 3000, cost: 0.4 }, { ms: null, cost: null }],
      feedback: [{ rating: "pass" }, { rating: "pass" }, { rating: "fail" }],
    });
    expect(m.avg_ms).toBe(2000);
    expect(m.quality).toBeCloseTo(2 / 3);
  });

  it("cost_saving = automated*baseline − actualCost, floored at 0", () => {
    const m = computeMetrics({
      decisions: [{ verdict: "ai" }, { verdict: "ai" }],
      executions: [{ ms: 100, cost: 0.5 }],
      feedback: [],
      humanBaselineCost: 40,
    });
    expect(m.cost_saving).toBe(2 * 40 - 0.5);
  });
});

describe("computeBreakdown", () => {
  const recs: TaskRecord[] = [
    { side: "human", minutes: 120, cost: 40, rating: "pass", estimated: true },
    { side: "human", minutes: 240, cost: 80, rating: "fail", estimated: true },
    { side: "ai", minutes: 1, cost: 0.3, rating: "pass", estimated: false },
    { side: "ai", minutes: 2, cost: 0.5, rating: null, estimated: false },
    { side: null, minutes: null, cost: null, rating: null, estimated: false },
  ];
  it("splits by side and aggregates", () => {
    const { human, ai } = computeBreakdown(recs);
    expect(human.tasks).toBe(2);
    expect(human.avgMinutes).toBe(180);
    expect(human.totalCost).toBe(120);
    expect(human.quality).toBeCloseTo(0.5);
    expect(human.estimated).toBe(true);
    expect(ai.tasks).toBe(2);
    expect(ai.totalCost).toBe(0.8);
    expect(ai.quality).toBe(1); // 1 pass, 0 fail among rated
    expect(ai.feedbackCount).toBe(1);
    expect(ai.estimated).toBe(false);
  });
});

describe("computeFlow", () => {
  const NOW = 10 * 86_400_000; // day 10
  it("empty → zeros", () => {
    expect(computeFlow([], NOW)).toEqual({
      completed: 0,
      leadTimeMsP50: 0,
      leadTimeMsAvg: 0,
      throughput: 0,
      windowDays: 7,
    });
  });
  it("median lead time resists outliers; throughput counts within window", () => {
    const events: DoneEvent[] = [
      { leadMs: 1000, doneAt: NOW - 1 * 86_400_000 }, // in window
      { leadMs: 3000, doneAt: NOW - 2 * 86_400_000 }, // in window
      { leadMs: 100000, doneAt: NOW - 9 * 86_400_000 }, // outside 7d window
    ];
    const f = computeFlow(events, NOW, 7);
    expect(f.completed).toBe(3);
    expect(f.leadTimeMsP50).toBe(3000); // median, not skewed by 100000
    expect(f.throughput).toBe(2); // only 2 within 7 days
  });
});
