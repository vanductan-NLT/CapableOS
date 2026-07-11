import type { PoolCandidate, RequiredCapability } from "@orchestra/contracts";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ScoringError } from "./errors";
import { scoreCandidates } from "./score";

describe("scoreCandidates", () => {
  it("scores one capability and one candidate", () => {
    const result = scoreCandidates({
      required: [{ cap: "summarization", weight: 1 }],
      candidates: [candidate("a", { summarization: 0.9 }, 80)],
    });

    expect(result.scorable).toBe(true);
    if (!result.scorable) return;
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].match).toBeCloseTo(0.9);
    expect(result.candidates[0].normalizedTrust).toBeCloseTo(0.8);
    expect(result.candidates[0].fit).toBeCloseTo(0.87);
    expect(result.ambiguity).toBeNull();
  });

  it("scores multiple capabilities with different weights", () => {
    const result = scoreCandidates({
      required: [
        { cap: "summarization", weight: 0.7 },
        { cap: "analysis", weight: 0.3 },
      ],
      candidates: [candidate("a", { summarization: 0.9, analysis: 0.8 }, 90)],
    });

    expectScorable(result);
    expect(result.candidates[0].match).toBeCloseTo(0.87);
    expect(result.candidates[0].fit).toBeCloseTo(0.879);
  });

  it("scores a missing required candidate capability as zero", () => {
    const result = scoreCandidates({
      required: [
        { cap: "summarization", weight: 0.5 },
        { cap: "analysis", weight: 0.5 },
      ],
      candidates: [candidate("a", { summarization: 0.8 }, 50)],
    });

    expectScorable(result);
    expect(result.candidates[0].match).toBeCloseTo(0.4);
    expect(result.candidates[0].fit).toBeCloseTo(0.43);
  });

  it("ranks by fit descending", () => {
    const result = scoreCandidates({
      required: [{ cap: "analysis", weight: 1 }],
      candidates: [
        candidate("lower", { analysis: 0.5 }, 50),
        candidate("higher", { analysis: 0.8 }, 80),
      ],
    });

    expectScorable(result);
    expect(result.candidates.map((item) => item.id)).toEqual(["higher", "lower"]);
  });

  it("normalizes trust by dividing by 100", () => {
    const result = scoreCandidates({
      required: [{ cap: "analysis", weight: 1 }],
      candidates: [candidate("a", { analysis: 0 }, 90)],
    });

    expectScorable(result);
    expect(result.candidates[0].normalizedTrust).toBeCloseTo(0.9);
    expect(result.candidates[0].fit).toBeCloseTo(0.27);
  });

  it("allows a high match low trust candidate to outrank when fit is higher", () => {
    const result = scoreCandidates({
      required: [{ cap: "analysis", weight: 1 }],
      candidates: [
        candidate("high-match", { analysis: 1 }, 0),
        candidate("high-trust", { analysis: 0.4 }, 100),
      ],
    });

    expectScorable(result);
    expect(result.candidates.map((item) => item.id)).toEqual(["high-match", "high-trust"]);
  });

  it("allows a lower match higher trust candidate to outrank when fit is higher", () => {
    const result = scoreCandidates({
      required: [{ cap: "analysis", weight: 1 }],
      candidates: [
        candidate("high-match", { analysis: 0.6 }, 0),
        candidate("high-trust", { analysis: 0.3 }, 100),
      ],
    });

    expectScorable(result);
    expect(result.candidates.map((item) => item.id)).toEqual(["high-trust", "high-match"]);
  });

  it("uses match then candidate id as deterministic tie-breaks", () => {
    const result = scoreCandidates({
      required: [{ cap: "analysis", weight: 1 }],
      candidates: [
        candidate("b", { analysis: 0.5 }, 50),
        candidate("a", { analysis: 0.5 }, 50),
      ],
    });

    expectScorable(result);
    expect(result.candidates.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("uses match as the second tie-break when fit is within epsilon", () => {
    const result = scoreCandidates({
      required: [{ cap: "analysis", weight: 1 }],
      candidates: [
        candidate("lower-match", { analysis: 0.5 }, 50),
        candidate("higher-match", { analysis: 0.5 + 2e-10 }, 50 - (0.7 * 2e-10 * 100) / 0.3),
      ],
    });

    expectScorable(result);
    expect(result.candidates.map((item) => item.id)).toEqual(["higher-match", "lower-match"]);
  });

  it("returns ambiguity for two candidates", () => {
    const result = scoreCandidates({
      required: [{ cap: "analysis", weight: 1 }],
      candidates: [candidate("a", { analysis: 1 }, 100), candidate("b", { analysis: 0.5 }, 50)],
    });

    expectScorable(result);
    expect(result.ambiguity).toBeCloseTo(result.candidates[0].fit - result.candidates[1].fit);
  });

  it("returns not scorable for empty required capabilities without validating candidates", () => {
    expect(
      scoreCandidates({
        required: [],
        candidates: [candidate("bad", { analysis: 2 }, 140)],
      }),
    ).toEqual({
      scorable: false,
      candidates: [],
      ambiguity: null,
      reason: "NO_REQUIRED_CAPABILITIES",
    });
  });

  it("returns not scorable for empty candidates", () => {
    expect(
      scoreCandidates({
        required: [{ cap: "analysis", weight: 1 }],
        candidates: [],
      }),
    ).toEqual({
      scorable: false,
      candidates: [],
      ambiguity: null,
      reason: "NO_CANDIDATES",
    });
  });

  it("rejects invalid required capabilities", () => {
    expect(() =>
      scoreCandidates({
        required: [{ cap: "cooking", weight: 1 } as unknown as RequiredCapability],
        candidates: [candidate("a", { analysis: 1 }, 100)],
      }),
    ).toThrowError(new ScoringError('Invalid required capability at index 0: received "cooking"'));
  });

  it.each([
    { weight: -0.1, label: "negative" },
    { weight: 0, label: "zero" },
    { weight: 1.1, label: "greater than one" },
    { weight: Number.NaN, label: "NaN" },
    { weight: Number.POSITIVE_INFINITY, label: "Infinity" },
  ])("rejects $label required weight", ({ weight }) => {
    expect(() =>
      scoreCandidates({
        required: [{ cap: "analysis", weight }],
        candidates: [candidate("a", { analysis: 1 }, 100)],
      }),
    ).toThrow(ScoringError);
  });

  it.each([
    { score: -0.1, label: "negative" },
    { score: 1.1, label: "greater than one" },
    { score: Number.NaN, label: "NaN" },
    { score: Number.POSITIVE_INFINITY, label: "Infinity" },
  ])("rejects $label candidate capability score", ({ score }) => {
    expect(() =>
      scoreCandidates({
        required: [{ cap: "writing", weight: 1 }],
        candidates: [candidate("a", { analysis: score }, 100)],
      }),
    ).toThrow(ScoringError);
  });

  it("rejects capability keys outside the taxonomy", () => {
    expect(() =>
      scoreCandidates({
        required: [{ cap: "analysis", weight: 1 }],
        candidates: [
          {
            ...candidate("ai-claude", { analysis: 1 }, 100),
            caps: { analysis: 1, cooking: 0.8 },
          } as unknown as PoolCandidate,
        ],
      }),
    ).toThrowError(
      new ScoringError(
        'Invalid capability key for candidate "ai-claude": "cooking" is not in the capability taxonomy',
      ),
    );
  });

  it.each([
    { trust: -1, label: "negative" },
    { trust: 101, label: "greater than 100" },
    { trust: Number.NaN, label: "NaN" },
    { trust: Number.POSITIVE_INFINITY, label: "Infinity" },
  ])("rejects $label trust", ({ trust }) => {
    expect(() =>
      scoreCandidates({
        required: [{ cap: "analysis", weight: 1 }],
        candidates: [candidate("a", { analysis: 1 }, trust)],
      }),
    ).toThrow(ScoringError);
  });

  it.each([
    { weights: { match: 0.7, trust: 0.2 }, label: "sum below one" },
    { weights: { match: 0.7, trust: 0.4 }, label: "sum above one" },
    { weights: { match: -0.1, trust: 1.1 }, label: "negative component" },
    { weights: { match: Number.NaN, trust: 1 }, label: "NaN component" },
    { weights: { match: Number.POSITIVE_INFINITY, trust: 0 }, label: "Infinity component" },
  ])("rejects invalid scoring config: $label", ({ weights }) => {
    expect(() =>
      scoreCandidates({
        required: [{ cap: "analysis", weight: 1 }],
        candidates: [candidate("a", { analysis: 1 }, 100)],
        weights,
      }),
    ).toThrow(ScoringError);
  });

  it("does not mutate input", () => {
    const input = {
      required: [
        { cap: "analysis", weight: 0.7 },
        { cap: "summarization", weight: 0.3 },
      ] satisfies RequiredCapability[],
      candidates: [
        candidate("b", { analysis: 0.6, summarization: 0.2 }, 70),
        candidate("a", { analysis: 0.6, summarization: 0.2 }, 70),
      ],
    };
    const snapshot = structuredClone(input);

    scoreCandidates(input);

    expect(input).toEqual(snapshot);
  });

  it("keeps full precision in scoring core", () => {
    const result = scoreCandidates({
      required: [
        { cap: "analysis", weight: 1 / 3 },
        { cap: "summarization", weight: 2 / 3 },
      ],
      candidates: [candidate("a", { analysis: 0.123456789, summarization: 0.987654321 }, 88)],
    });

    expectScorable(result);
    expect(result.candidates[0].match).toBeCloseTo(
      ((1 / 3) * 0.123456789 + (2 / 3) * 0.987654321) / 1,
    );
  });

  it("scores the real mock Pool normal case", () => {
    const result = scoreCandidates({
      required: [
        { cap: "summarization", weight: 0.7 },
        { cap: "analysis", weight: 0.3 },
      ],
      candidates: mockPool(),
    });

    expectScorable(result);
    expect(result.candidates[0].id).toBe("ai-scribe-summarizer");
    expect(result.candidates[0].match).toBeCloseTo(0.854);
    expect(result.candidates[0].normalizedTrust).toBeCloseTo(0.83);
    expect(result.candidates[0].fit).toBeCloseTo(0.8468);
    expect(result.ambiguity).toBeCloseTo(0.0922);
  });

  it("has an ambiguous case in the real mock Pool", () => {
    const result = scoreCandidates({
      required: [
        { cap: "research", weight: 0.5 },
        { cap: "writing", weight: 0.5 },
      ],
      candidates: mockPool(),
    });

    expectScorable(result);
    expect(result.candidates[0].id).toBe("human-linh-researcher");
    expect(result.candidates[1].id).toBe("human-anna-writer");
    expect(result.ambiguity).toBeLessThan(0.1);
    expect(result.ambiguity).toBeCloseTo(0.0045);
  });

  it("has a no-fit case in the real mock Pool without returning business failure", () => {
    const result = scoreCandidates({
      required: [{ cap: "coding", weight: 1 }],
      candidates: mockPool(),
    });

    expectScorable(result);
    expect(result.candidates.every((item) => item.fit < 0.4)).toBe(true);
    expect(result.candidates[0].id).toBe("human-linh-researcher");
    expect(result.candidates[0].fit).toBeCloseTo(0.343);
  });

  it("does not merge or normalize duplicate required capabilities", () => {
    const result = scoreCandidates({
      required: [
        { cap: "analysis", weight: 0.5 },
        { cap: "analysis", weight: 0.25 },
      ],
      candidates: [candidate("a", { analysis: 0.8 }, 90)],
    });

    expectScorable(result);
    expect(result.candidates[0].match).toBeCloseTo(0.8);
  });
});

function candidate(
  id: string,
  caps: PoolCandidate["caps"],
  trust: number,
  overrides: Partial<PoolCandidate> = {},
): PoolCandidate {
  return {
    id,
    type: "ai",
    name: id,
    trust,
    cost: 0,
    minutes: 1,
    caps,
    ...overrides,
  };
}

function mockPool(): PoolCandidate[] {
  return JSON.parse(
    readFileSync(new URL("../../planner/mocks/pool.json", import.meta.url), "utf8"),
  ) as PoolCandidate[];
}

function expectScorable(result: ReturnType<typeof scoreCandidates>): asserts result is Extract<
  ReturnType<typeof scoreCandidates>,
  { scorable: true }
> {
  expect(result.scorable).toBe(true);
}
