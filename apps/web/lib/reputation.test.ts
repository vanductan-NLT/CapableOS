import { describe, expect, it } from "vitest";
import { computeReputation, wilsonLower, type FeedbackEvent } from "./reputation";

const ev = (rating: "pass" | "fail", at: number): FeedbackEvent => ({ rating, at });

describe("wilsonLower", () => {
  it("0 ratings → 0", () => expect(wilsonLower(0, 0)).toBe(0));
  it("penalises small samples: 1/1 ranks below 48/50", () => {
    expect(wilsonLower(1, 1)).toBeLessThan(wilsonLower(48, 50));
  });
  it("more evidence tightens the bound upward for same rate", () => {
    expect(wilsonLower(90, 100)).toBeGreaterThan(wilsonLower(9, 10));
  });
  it("stays within [0,1]", () => {
    expect(wilsonLower(5, 5)).toBeLessThanOrEqual(1);
    expect(wilsonLower(0, 5)).toBeGreaterThanOrEqual(0);
  });
});

describe("computeReputation", () => {
  it("no feedback → neutral prior, zero counts", () => {
    const r = computeReputation([]);
    expect(r).toMatchObject({ n: 0, passes: 0, raw: 0, wilson: 0, trend: "flat" });
    expect(r.bayesian).toBeCloseTo(0.7); // prior mean
    expect(r.ewma).toBeCloseTo(0.7);
  });

  it("all pass → high wilson, raw 1", () => {
    const r = computeReputation(Array.from({ length: 20 }, (_, i) => ev("pass", i)));
    expect(r.raw).toBe(1);
    expect(r.wilson).toBeGreaterThan(0.8);
    expect(r.passes).toBe(20);
  });

  it("sparse data is pulled toward prior by bayesian", () => {
    const oneFail = computeReputation([ev("fail", 1)]);
    expect(oneFail.raw).toBe(0);
    expect(oneFail.bayesian).toBeGreaterThan(0.5); // not slammed to 0
  });

  it("EWMA rewards recent improvement over old failures", () => {
    const events = [
      ...Array.from({ length: 5 }, (_, i) => ev("fail", i)),
      ...Array.from({ length: 5 }, (_, i) => ev("pass", 100 + i)),
    ];
    const r = computeReputation(events);
    expect(r.ewma).toBeGreaterThan(r.raw); // recent passes lift EWMA above 0.5 raw
    expect(r.trend).toBe("up");
  });

  it("detects declining trend", () => {
    const events = [
      ...Array.from({ length: 5 }, (_, i) => ev("pass", i)),
      ...Array.from({ length: 5 }, (_, i) => ev("fail", 100 + i)),
    ];
    expect(computeReputation(events).trend).toBe("down");
  });

  it("is order-independent for counts (sorts by time)", () => {
    const a = computeReputation([ev("pass", 2), ev("fail", 1)]);
    const b = computeReputation([ev("fail", 1), ev("pass", 2)]);
    expect(a).toEqual(b);
  });
});
