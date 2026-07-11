import { describe, expect, it } from "vitest";
import { applyFeedback, clampTrust, trustDelta } from "./trust";

describe("trust engine", () => {
  it("pass → +1, fail → −1", () => {
    expect(trustDelta("pass")).toBe(1);
    expect(trustDelta("fail")).toBe(-1);
  });

  it("clamps to 0..100", () => {
    expect(clampTrust(150)).toBe(100);
    expect(clampTrust(-5)).toBe(0);
    expect(clampTrust(72.6)).toBe(73);
  });

  it("applyFeedback returns delta + bounded next", () => {
    expect(applyFeedback(80, "pass")).toEqual({ delta: 1, next: 81 });
    expect(applyFeedback(100, "pass")).toEqual({ delta: 1, next: 100 }); // capped
    expect(applyFeedback(0, "fail")).toEqual({ delta: -1, next: 0 }); // floored
  });
});
