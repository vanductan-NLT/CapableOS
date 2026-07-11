import { describe, expect, it } from "vitest";
import { computeBreakdown, computeMetrics, emptySplit, type TaskRecord } from "./metrics";

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
