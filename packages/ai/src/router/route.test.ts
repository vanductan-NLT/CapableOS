import type { PoolCandidate, Risk } from "@orchestra/contracts";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scoreCandidates, type ScoredCandidate, type ScoringResult } from "../scoring";
import { DEFAULT_ROUTER_CONFIG } from "./config";
import { RouterError } from "./errors";
import { routeDecision } from "./route";

describe("routeDecision", () => {
  it("escalates when scoring has no required capabilities", () => {
    expect(
      routeDecision({
        risk: "high",
        scoring: {
          scorable: false,
          candidates: [],
          ambiguity: null,
          reason: "NO_REQUIRED_CAPABILITIES",
        },
      }),
    ).toEqual({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "NO_REQUIRED_CAPABILITIES",
      ambiguity: null,
    });
  });

  it("escalates when scoring has no candidates", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: {
          scorable: false,
          candidates: [],
          ambiguity: null,
          reason: "NO_CANDIDATES",
        },
      }).reasonCode,
    ).toBe("NO_CANDIDATES");
  });

  it("escalates when top fit is below the minimum threshold", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("ai-low", "ai", 0.399)]),
      }),
    ).toEqual({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "TOP_FIT_BELOW_THRESHOLD",
      topCandidateId: "ai-low",
      topFit: 0.399,
      ambiguity: null,
    });
  });

  it("continues routing when top fit equals the minimum threshold", () => {
    expect(
      routeDecision({
        risk: "high",
        scoring: scorable([candidate("human-threshold", "human", 0.4)]),
      }).verdict,
    ).toBe("human");
  });

  it("routes a single human candidate to human", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("human-a", "human", 0.9)]),
      }),
    ).toMatchObject({
      verdict: "human",
      selectedCandidateIds: ["human-a"],
      reasonCode: "TOP_CANDIDATE_HUMAN",
    });
  });

  it("routes a high-risk top human candidate to human", () => {
    expect(
      routeDecision({
        risk: "high",
        scoring: scorable([candidate("human-a", "human", 0.9)]),
      }),
    ).toMatchObject({
      verdict: "human",
      selectedCandidateIds: ["human-a"],
      reasonCode: "TOP_CANDIDATE_HUMAN",
    });
  });

  it("routes a low-risk top AI candidate to AI", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("ai-a", "ai", 0.9)]),
      }),
    ).toMatchObject({
      verdict: "ai",
      selectedCandidateIds: ["ai-a"],
      reasonCode: "TOP_CANDIDATE_AI_LOW_RISK",
    });
  });

  it("routes a high-risk top AI candidate to hybrid with the best ranked human reviewer", () => {
    expect(
      routeDecision({
        risk: "high",
        scoring: scorable([
          candidate("ai-a", "ai", 0.9),
          candidate("ai-b", "ai", 0.8),
          candidate("human-reviewer", "human", 0.7),
        ]),
      }),
    ).toMatchObject({
      verdict: "hybrid",
      selectedCandidateIds: ["ai-a", "human-reviewer"],
      reasonCode: "HIGH_RISK_AI_REQUIRES_HUMAN",
    });
  });

  it("escalates a high-risk top AI candidate when no human reviewer exists", () => {
    expect(
      routeDecision({
        risk: "high",
        scoring: scorable([candidate("ai-a", "ai", 0.9), candidate("ai-b", "ai", 0.8)]),
      }),
    ).toMatchObject({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "NO_HUMAN_REVIEWER_AVAILABLE",
      topCandidateId: "ai-a",
      topFit: 0.9,
    });
  });

  it("treats ambiguity exactly at threshold as not ambiguous", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: {
          scorable: true,
          candidates: [candidate("ai-a", "ai", 0.8), candidate("human-a", "human", 0.75)],
          ambiguity: DEFAULT_ROUTER_CONFIG.ambiguityThreshold,
        },
      }),
    ).toMatchObject({
      verdict: "ai",
      selectedCandidateIds: ["ai-a"],
      reasonCode: "TOP_CANDIDATE_AI_LOW_RISK",
      ambiguity: DEFAULT_ROUTER_CONFIG.ambiguityThreshold,
    });
  });

  it("routes ambiguous human plus AI to hybrid with IDs ordered AI then human", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("human-a", "human", 0.8), candidate("ai-a", "ai", 0.79)]),
      }),
    ).toMatchObject({
      verdict: "hybrid",
      selectedCandidateIds: ["ai-a", "human-a"],
      reasonCode: "AMBIGUOUS_HUMAN_AI_HYBRID",
    });
  });

  it("escalates ambiguous human candidates", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: scorable([
          candidate("human-a", "human", 0.8),
          candidate("human-b", "human", 0.795),
        ]),
      }),
    ).toMatchObject({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "AMBIGUOUS_HUMAN_CANDIDATES",
    });
  });

  it("escalates ambiguous AI candidates", () => {
    expect(
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("ai-a", "ai", 0.8), candidate("ai-b", "ai", 0.795)]),
      }),
    ).toMatchObject({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "AMBIGUOUS_AI_CANDIDATES",
    });
  });

  it("routes the real mock Pool normal low-risk case to AI", () => {
    const scoring = scoreCandidates({
      required: [
        { cap: "summarization", weight: 0.7 },
        { cap: "analysis", weight: 0.3 },
      ],
      candidates: mockPool(),
    });

    expect(routeDecision({ risk: "low", scoring })).toMatchObject({
      verdict: "ai",
      selectedCandidateIds: ["ai-scribe-summarizer"],
      reasonCode: "TOP_CANDIDATE_AI_LOW_RISK",
      topCandidateId: "ai-scribe-summarizer",
    });
  });

  it("routes the real mock Pool normal high-risk case to hybrid", () => {
    const scoring = scoreCandidates({
      required: [
        { cap: "summarization", weight: 0.7 },
        { cap: "analysis", weight: 0.3 },
      ],
      candidates: mockPool(),
    });

    expect(routeDecision({ risk: "high", scoring })).toMatchObject({
      verdict: "hybrid",
      selectedCandidateIds: ["ai-scribe-summarizer", "human-linh-researcher"],
      reasonCode: "HIGH_RISK_AI_REQUIRES_HUMAN",
    });
  });

  it("escalates the real mock Pool no-fit case", () => {
    const scoring = scoreCandidates({
      required: [{ cap: "coding", weight: 1 }],
      candidates: mockPool(),
    });

    expect(routeDecision({ risk: "low", scoring })).toMatchObject({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "TOP_FIT_BELOW_THRESHOLD",
      topCandidateId: "human-linh-researcher",
    });
  });

  it("escalates the real mock Pool ambiguous human-human case", () => {
    const scoring = scoreCandidates({
      required: [
        { cap: "research", weight: 0.5 },
        { cap: "writing", weight: 0.5 },
      ],
      candidates: mockPool(),
    });

    expect(routeDecision({ risk: "low", scoring })).toMatchObject({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "AMBIGUOUS_HUMAN_CANDIDATES",
    });
  });

  it("throws for invalid risk", () => {
    expect(() =>
      routeDecision({
        risk: "medium" as Risk,
        scoring: scorable([candidate("ai-a", "ai", 0.9)]),
      }),
    ).toThrow(RouterError);
  });

  it.each([
    { config: { minimumFit: -0.1, ambiguityThreshold: 0.05 }, label: "negative minimum" },
    { config: { minimumFit: 0.4, ambiguityThreshold: 1.1 }, label: "large ambiguity" },
    {
      config: { minimumFit: Number.NaN, ambiguityThreshold: 0.05 },
      label: "NaN minimum",
    },
    {
      config: { minimumFit: 0.4, ambiguityThreshold: Number.POSITIVE_INFINITY },
      label: "infinite ambiguity",
    },
  ])("throws for invalid router config: $label", ({ config }) => {
    expect(() =>
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("ai-a", "ai", 0.9)]),
        config,
      }),
    ).toThrow(RouterError);
  });

  it("throws when scorable true has no candidates", () => {
    expect(() =>
      routeDecision({
        risk: "low",
        scoring: { scorable: true, candidates: [], ambiguity: null },
      }),
    ).toThrow(RouterError);
  });

  it("throws when candidates are not ranked by descending fit", () => {
    expect(() =>
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("ai-low", "ai", 0.7), candidate("ai-high", "ai", 0.8)]),
      }),
    ).toThrow(RouterError);
  });

  it.each([
    { fit: Number.NaN, label: "NaN" },
    { fit: Number.POSITIVE_INFINITY, label: "Infinity" },
    { fit: -0.1, label: "negative" },
    { fit: 1.1, label: "greater than one" },
  ])("throws when candidate fit is $label", ({ fit }) => {
    expect(() =>
      routeDecision({
        risk: "low",
        scoring: scorable([candidate("ai-a", "ai", fit)]),
      }),
    ).toThrow(RouterError);
  });

  it("throws when one candidate has non-null ambiguity", () => {
    expect(() =>
      routeDecision({
        risk: "low",
        scoring: {
          scorable: true,
          candidates: [candidate("ai-a", "ai", 0.9)],
          ambiguity: 0,
        },
      }),
    ).toThrow(RouterError);
  });

  it("throws when multi-candidate ambiguity is null", () => {
    expect(() =>
      routeDecision({
        risk: "low",
        scoring: {
          scorable: true,
          candidates: [candidate("ai-a", "ai", 0.9), candidate("human-a", "human", 0.8)],
          ambiguity: null,
        },
      }),
    ).toThrow(RouterError);
  });

  it("throws when ambiguity does not match the top two fit delta", () => {
    expect(() =>
      routeDecision({
        risk: "low",
        scoring: {
          scorable: true,
          candidates: [candidate("ai-a", "ai", 0.9), candidate("human-a", "human", 0.8)],
          ambiguity: 0.2,
        },
      }),
    ).toThrow(RouterError);
  });

  it("does not mutate scoring input", () => {
    const scoring = scorable([candidate("human-a", "human", 0.8), candidate("ai-a", "ai", 0.79)]);
    const snapshot = structuredClone(scoring);

    routeDecision({ risk: "low", scoring });

    expect(scoring).toEqual(snapshot);
  });

  it("returns deterministic output for the same input", () => {
    const scoring = scorable([candidate("ai-a", "ai", 0.8), candidate("human-a", "human", 0.7)]);

    expect(routeDecision({ risk: "high", scoring })).toEqual(
      routeDecision({ risk: "high", scoring }),
    );
  });
});

function candidate(id: string, type: "human" | "ai", fit: number): ScoredCandidate {
  return {
    id,
    type,
    name: id,
    trust: 80,
    normalizedTrust: 0.8,
    cost: 0,
    minutes: 1,
    match: fit,
    fit,
  };
}

function scorable(candidates: ScoredCandidate[]): ScoringResult {
  return {
    scorable: true,
    candidates,
    ambiguity:
      candidates.length >= 2 ? Math.max(0, candidates[0].fit - candidates[1].fit) : null,
  };
}

function mockPool(): PoolCandidate[] {
  return JSON.parse(
    readFileSync(new URL("../../planner/mocks/pool.json", import.meta.url), "utf8"),
  ) as PoolCandidate[];
}
