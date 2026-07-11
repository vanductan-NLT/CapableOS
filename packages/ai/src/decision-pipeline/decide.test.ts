import type { PoolCandidate } from "@orchestra/contracts";
import { MockLanguageModelV2 } from "ai/test";
import { describe, expect, it } from "vitest";
import { decideTask as exportedDecideTask } from "../index";
import { RouterError } from "../router";
import { ScoringError } from "../scoring";
import { decideTask } from "./decide";

const usage = {
  inputTokens: 10,
  outputTokens: 10,
  totalTokens: 20,
};

describe("decideTask", () => {
  it("routes a normal low-risk AI task through Planner, Scoring, and Router", async () => {
    const result = await decideTask({
      task: { title: "Tóm tắt báo cáo quý này" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [
            { cap: "summarization", weight: 0.7 },
            { cap: "analysis", weight: 0.3 },
          ],
          missing: [],
          rationale: "Cần tóm tắt và phân tích báo cáo.",
        }),
      },
    });

    expect(result.plan).toEqual({
      required: [
        { cap: "summarization", weight: 0.7 },
        { cap: "analysis", weight: 0.3 },
      ],
      risk: "low",
    });
    expectScorable(result.scoring);
    expect(result.route).toMatchObject({
      verdict: "ai",
      selectedCandidateIds: ["ai-scribe-summarizer"],
      reasonCode: "TOP_CANDIDATE_AI_LOW_RISK",
      topCandidateId: "ai-scribe-summarizer",
    });
  });

  it("routes a normal high-risk top AI task to hybrid", async () => {
    const result = await decideTask({
      task: { title: "Tóm tắt hợp đồng quý này" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [
            { cap: "summarization", weight: 0.7 },
            { cap: "analysis", weight: 0.3 },
          ],
          missing: [],
          rationale: "Cần tóm tắt và phân tích báo cáo.",
        }),
      },
    });

    expect(result.plan.risk).toBe("high");
    expect(result.route).toMatchObject({
      verdict: "hybrid",
      selectedCandidateIds: ["ai-scribe-summarizer", "human-linh-researcher"],
      reasonCode: "HIGH_RISK_AI_REQUIRES_HUMAN",
    });
  });

  it("passes Planner unresolved output through Scoring and Router", async () => {
    const result = await decideTask({
      task: { title: "Chuẩn bị onboarding" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [],
          missing: ["unresolved"],
          rationale: "Không xác định được capability.",
        }),
      },
    });

    expect(result.plan).toEqual({ required: [], risk: "high" });
    expect(result.scoring).toEqual({
      scorable: false,
      candidates: [],
      ambiguity: null,
      reason: "NO_REQUIRED_CAPABILITIES",
    });
    expect(result.route).toEqual({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "NO_REQUIRED_CAPABILITIES",
      ambiguity: null,
    });
  });

  it("passes an empty Pool through Scoring and Router", async () => {
    const result = await decideTask({
      task: { title: "Tóm tắt báo cáo quý này" },
      candidates: [],
      plannerOptions: {
        model: modelWithObject({
          required: [{ cap: "summarization", weight: 1 }],
          missing: [],
          rationale: "Cần tóm tắt.",
        }),
      },
    });

    expect(result.scoring).toEqual({
      scorable: false,
      candidates: [],
      ambiguity: null,
      reason: "NO_CANDIDATES",
    });
    expect(result.route).toEqual({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "NO_CANDIDATES",
      ambiguity: null,
    });
  });

  it("passes a no-fit scoring result through Router", async () => {
    const result = await decideTask({
      task: { title: "Implement batch job" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [{ cap: "coding", weight: 1 }],
          missing: [],
          rationale: "Cần lập trình.",
        }),
      },
    });

    expectScorable(result.scoring);
    expect(result.route).toMatchObject({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "TOP_FIT_BELOW_THRESHOLD",
      topCandidateId: "human-linh-researcher",
    });
  });

  it("passes an ambiguous human-human scoring result through Router", async () => {
    const result = await decideTask({
      task: { title: "Nghiên cứu và viết blog về AI" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [
            { cap: "research", weight: 0.5 },
            { cap: "writing", weight: 0.5 },
          ],
          missing: [],
          rationale: "Cần nghiên cứu và viết.",
        }),
      },
    });

    expectScorable(result.scoring);
    expect(result.scoring.candidates.slice(0, 2).map((candidate) => candidate.id)).toEqual([
      "human-linh-researcher",
      "human-anna-writer",
    ]);
    expect(result.route).toMatchObject({
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "AMBIGUOUS_HUMAN_CANDIDATES",
    });
  });

  it("passes an ambiguous human-AI scoring result through Router", async () => {
    const result = await decideTask({
      task: { title: "Phân tích dữ liệu" },
      candidates: ambiguousHumanAiPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [{ cap: "analysis", weight: 1 }],
          missing: [],
          rationale: "Cần phân tích.",
        }),
      },
    });

    expectScorable(result.scoring);
    expect(result.scoring.ambiguity).toBeLessThan(0.05);
    expect(result.route).toMatchObject({
      verdict: "hybrid",
      selectedCandidateIds: ["ai-close-analyst", "human-close-analyst"],
      reasonCode: "AMBIGUOUS_HUMAN_AI_HYBRID",
    });
  });

  it("uses Planner fallback when the model fails and keywords match", async () => {
    const result = await decideTask({
      task: { title: "Viết blog về AI" },
      candidates: mockPool(),
      plannerOptions: {
        model: throwingModel(),
      },
    });

    expect(result.plan).toEqual({
      required: [{ cap: "writing", weight: 1 }],
      risk: "high",
    });
    expectScorable(result.scoring);
    expect(result.route.verdict).not.toBe("escalate");
  });

  it("uses Planner fallback unresolved behavior when the model fails and no keyword matches", async () => {
    const result = await decideTask({
      task: { title: "Chuẩn bị onboarding" },
      candidates: mockPool(),
      plannerOptions: {
        model: throwingModel(),
      },
    });

    expect(result.plan).toEqual({
      required: [],
      risk: "high",
    });
    expect(result.scoring).toMatchObject({
      scorable: false,
      reason: "NO_REQUIRED_CAPABILITIES",
    });
    expect(result.route).toMatchObject({
      verdict: "escalate",
      reasonCode: "NO_REQUIRED_CAPABILITIES",
    });
  });

  it("passes custom scoring weights through to Scoring", async () => {
    const baseInput = {
      task: { title: "Tóm tắt báo cáo quý này" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [
            { cap: "summarization", weight: 0.7 },
            { cap: "analysis", weight: 0.3 },
          ],
          missing: [],
          rationale: "Cần tóm tắt và phân tích báo cáo.",
        }),
      },
    };
    const defaultResult = await decideTask(baseInput);
    const customResult = await decideTask({
      ...baseInput,
      plannerOptions: {
        model: modelWithObject({
          required: [
            { cap: "summarization", weight: 0.7 },
            { cap: "analysis", weight: 0.3 },
          ],
          missing: [],
          rationale: "Cần tóm tắt và phân tích báo cáo.",
        }),
      },
      scoringWeights: { match: 1, trust: 0 },
    });

    expectScorable(defaultResult.scoring);
    expectScorable(customResult.scoring);
    expect(customResult.scoring.candidates[0].fit).not.toBeCloseTo(
      defaultResult.scoring.candidates[0].fit,
    );
    expect(customResult.scoring.candidates[0].fit).toBeCloseTo(
      customResult.scoring.candidates[0].match,
    );
  });

  it("passes custom router config through to Router", async () => {
    const defaultResult = await decideTask({
      task: { title: "Tóm tắt báo cáo quý này" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [
            { cap: "summarization", weight: 0.7 },
            { cap: "analysis", weight: 0.3 },
          ],
          missing: [],
          rationale: "Cần tóm tắt và phân tích báo cáo.",
        }),
      },
    });
    const customResult = await decideTask({
      task: { title: "Tóm tắt báo cáo quý này" },
      candidates: mockPool(),
      plannerOptions: {
        model: modelWithObject({
          required: [
            { cap: "summarization", weight: 0.7 },
            { cap: "analysis", weight: 0.3 },
          ],
          missing: [],
          rationale: "Cần tóm tắt và phân tích báo cáo.",
        }),
      },
      routerConfig: { minimumFit: 0.4, ambiguityThreshold: 0.1 },
    });

    expect(defaultResult.route).toMatchObject({
      verdict: "ai",
      reasonCode: "TOP_CANDIDATE_AI_LOW_RISK",
    });
    expect(customResult.route).toMatchObject({
      verdict: "hybrid",
      reasonCode: "AMBIGUOUS_HUMAN_AI_HYBRID",
      selectedCandidateIds: ["ai-scribe-summarizer", "human-linh-researcher"],
    });
  });

  it("propagates ScoringError for invalid candidates", async () => {
    await expect(
      decideTask({
        task: { title: "Tóm tắt báo cáo quý này" },
        candidates: [
          {
            ...mockPool()[0],
            trust: 101,
          },
        ],
        plannerOptions: {
          model: modelWithObject({
            required: [{ cap: "summarization", weight: 1 }],
            missing: [],
            rationale: "Cần tóm tắt.",
          }),
        },
      }),
    ).rejects.toThrow(ScoringError);
  });

  it("propagates RouterError for invalid router config", async () => {
    await expect(
      decideTask({
        task: { title: "Tóm tắt báo cáo quý này" },
        candidates: mockPool(),
        plannerOptions: {
          model: modelWithObject({
            required: [{ cap: "summarization", weight: 1 }],
            missing: [],
            rationale: "Cần tóm tắt.",
          }),
        },
        routerConfig: { minimumFit: -0.1, ambiguityThreshold: 0.05 },
      }),
    ).rejects.toThrow(RouterError);
  });

  it("does not mutate task, candidates, or options", async () => {
    const task = { title: "Tóm tắt báo cáo quý này", description: "Bản nháp nội bộ" };
    const candidates = mockPool();
    const plannerOptions = {
      model: modelWithObject({
        required: [{ cap: "summarization", weight: 1 }],
        missing: [],
        rationale: "Cần tóm tắt.",
      }),
      timeoutMs: 1_000,
    };
    const scoringWeights = { match: 1, trust: 0 };
    const routerConfig = { minimumFit: 0.4, ambiguityThreshold: 0.05 };
    const taskSnapshot = structuredClone(task);
    const candidatesSnapshot = structuredClone(candidates);
    const scoringWeightsSnapshot = structuredClone(scoringWeights);
    const routerConfigSnapshot = structuredClone(routerConfig);

    await decideTask({
      task,
      candidates,
      plannerOptions,
      scoringWeights,
      routerConfig,
    });

    expect(task).toEqual(taskSnapshot);
    expect(candidates).toEqual(candidatesSnapshot);
    expect(scoringWeights).toEqual(scoringWeightsSnapshot);
    expect(routerConfig).toEqual(routerConfigSnapshot);
    expect(plannerOptions.timeoutMs).toBe(1_000);
  });

  it("is exported from the @orchestra/ai barrel", () => {
    expect(exportedDecideTask).toBe(decideTask);
  });
});

interface PlannerModelOutput {
  required: Array<{
    cap: string;
    weight: number;
  }>;
  missing: string[];
  rationale: string;
}

function modelWithObject(output: PlannerModelOutput): MockLanguageModelV2 {
  return new MockLanguageModelV2({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      finishReason: "stop",
      usage,
      warnings: [],
    }),
  });
}

function throwingModel(): MockLanguageModelV2 {
  return new MockLanguageModelV2({
    doGenerate: async () => {
      throw new Error("LLM unavailable");
    },
  });
}

function mockPool(): PoolCandidate[] {
  return [
    {
      id: "human-anna-writer",
      type: "human",
      name: "Anna Writer",
      trust: 86,
      cost: 0,
      minutes: 45,
      caps: {
        summarization: 0.55,
        research: 0.62,
        email_drafting: 0.7,
        translation: 0.2,
        meeting_notes: 0.48,
        writing: 0.88,
        analysis: 0.58,
        coding: 0.05,
        design: 0.36,
      },
    },
    {
      id: "human-minh-designer",
      type: "human",
      name: "Minh Designer",
      trust: 79,
      cost: 0,
      minutes: 60,
      caps: {
        summarization: 0.34,
        research: 0.4,
        email_drafting: 0.28,
        translation: 0.18,
        meeting_notes: 0.42,
        writing: 0.44,
        analysis: 0.5,
        coding: 0.08,
        design: 0.92,
      },
    },
    {
      id: "human-linh-researcher",
      type: "human",
      name: "Linh Researcher",
      trust: 91,
      cost: 0,
      minutes: 75,
      caps: {
        summarization: 0.64,
        research: 0.9,
        email_drafting: 0.46,
        translation: 0.22,
        meeting_notes: 0.52,
        writing: 0.57,
        analysis: 0.8,
        coding: 0.1,
        design: 0.3,
      },
    },
    {
      id: "ai-scribe-summarizer",
      type: "ai",
      name: "Scribe Summarizer",
      trust: 83,
      cost: 0.01,
      minutes: 3,
      caps: {
        summarization: 0.95,
        research: 0.52,
        email_drafting: 0.66,
        translation: 0.55,
        meeting_notes: 0.9,
        writing: 0.72,
        analysis: 0.63,
        coding: 0.04,
        design: 0.2,
      },
    },
    {
      id: "ai-polyglot-translator",
      type: "ai",
      name: "Polyglot Translator",
      trust: 78,
      cost: 0.02,
      minutes: 4,
      caps: {
        summarization: 0.58,
        research: 0.45,
        email_drafting: 0.52,
        translation: 0.96,
        meeting_notes: 0.5,
        writing: 0.6,
        analysis: 0.48,
        coding: 0.02,
        design: 0.18,
      },
    },
    {
      id: "ai-draft-emailer",
      type: "ai",
      name: "Draft Emailer",
      trust: 82,
      cost: 0.03,
      minutes: 5,
      caps: {
        summarization: 0.62,
        research: 0.54,
        email_drafting: 0.94,
        translation: 0.5,
        meeting_notes: 0.57,
        writing: 0.9,
        analysis: 0.55,
        coding: 0.03,
        design: 0.22,
      },
    },
  ];
}

function ambiguousHumanAiPool(): PoolCandidate[] {
  return [
    {
      id: "human-close-analyst",
      type: "human",
      name: "Human Close Analyst",
      trust: 80,
      cost: 0,
      minutes: 30,
      caps: { analysis: 0.79 },
    },
    {
      id: "ai-close-analyst",
      type: "ai",
      name: "AI Close Analyst",
      trust: 80,
      cost: 0.01,
      minutes: 3,
      caps: { analysis: 0.8 },
    },
    {
      id: "human-distant-analyst",
      type: "human",
      name: "Human Distant Analyst",
      trust: 60,
      cost: 0,
      minutes: 45,
      caps: { analysis: 0.4 },
    },
  ];
}

function expectScorable(
  result: Awaited<ReturnType<typeof decideTask>>["scoring"],
): asserts result is Extract<Awaited<ReturnType<typeof decideTask>>["scoring"], { scorable: true }> {
  expect(result.scorable).toBe(true);
}
