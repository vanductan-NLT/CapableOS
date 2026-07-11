import { describe, expect, it } from "vitest";
import type { AgentRow, DecisionRow, TaskRow } from "@/lib/db-types";
import {
  DecisionMapperError,
  type DecisionEngineResultForPersistence,
  agentRowToPoolCandidate,
  decisionResultToPersistenceInput,
  decisionRowToResponse,
  formatDecisionReason,
  taskRowToPlanInput,
} from "./mapper";

const taskRow: TaskRow = {
  id: "9a06c23e-1c6e-4b2a-9a61-51b8f8f7ff30",
  title: "Summarize research notes",
  description: "Pull out the key points",
  status: "created",
  decision_id: null,
  assignee_id: null,
  result: null,
  created_at: "2026-07-12T00:00:00.000Z",
};

const agentRow: AgentRow = {
  id: "ai-summarize",
  type: "ai",
  name: "Summarizer",
  role: "Summarize docs",
  trust: 80,
  cost: 0.3,
  minutes: 1,
  caps: { summarization: 0.9, writing: 0.7 },
  created_at: "2026-07-12T00:00:00.000Z",
};

const scoredAi = {
  id: "ai-summarize",
  type: "ai" as const,
  name: "Summarizer",
  trust: 80,
  normalizedTrust: 0.8,
  cost: 0.3,
  minutes: 1,
  match: 0.9,
  fit: 0.87,
};

const scoredHuman = {
  id: "h-alice",
  type: "human" as const,
  name: "Alice",
  trust: 90,
  normalizedTrust: 0.9,
  cost: 40,
  minutes: 120,
  match: 0.7,
  fit: 0.76,
};

describe("taskRowToPlanInput", () => {
  it("maps task title and description into planner input", () => {
    expect(taskRowToPlanInput(taskRow)).toEqual({
      title: "Summarize research notes",
      description: "Pull out the key points",
    });
  });

  it("omits null descriptions", () => {
    expect(taskRowToPlanInput({ ...taskRow, description: null })).toEqual({
      title: "Summarize research notes",
      description: undefined,
    });
  });
});

describe("agentRowToPoolCandidate", () => {
  it("maps valid agent rows to pool candidates", () => {
    expect(agentRowToPoolCandidate(agentRow)).toEqual({
      id: "ai-summarize",
      type: "ai",
      name: "Summarizer",
      trust: 80,
      cost: 0.3,
      minutes: 1,
      caps: { summarization: 0.9, writing: 0.7 },
    });
  });

  it.each([
    { patch: { type: "bot" }, message: "Invalid agent type" },
    { patch: { trust: -1 }, message: "Invalid trust" },
    { patch: { trust: 101 }, message: "Invalid trust" },
    { patch: { cost: null }, message: "Invalid cost" },
    { patch: { cost: -0.1 }, message: "Invalid cost" },
    { patch: { minutes: null }, message: "Invalid minutes" },
    { patch: { minutes: -1 }, message: "Invalid minutes" },
    { patch: { caps: { unknown_capability: 0.5 } }, message: "Invalid capability key" },
    { patch: { caps: { summarization: 1.1 } }, message: "Invalid capability" },
  ])("rejects invalid persisted agent data: $message", ({ patch, message }) => {
    expect(() => agentRowToPoolCandidate({ ...agentRow, ...patch } as AgentRow)).toThrowError(
      new RegExp(message),
    );
  });
});

describe("decisionResultToPersistenceInput", () => {
  it("maps an AI decision with null confidence, null governance, and selected estimate", () => {
    const input = decisionResultToPersistenceInput(taskRow.id, resultFor("ai", ["ai-summarize"]));

    expect(input).toMatchObject({
      task_id: taskRow.id,
      verdict: "ai",
      chosen: ["ai-summarize"],
      confidence: null,
      ambiguity: 0.11,
      governance: null,
      cost_est: 0.3,
      minutes_est: 1,
      estimated: true,
      reason: {
        code: "TOP_CANDIDATE_AI_LOW_RISK",
        selected_candidate_ids: ["ai-summarize"],
        top_candidate_id: "ai-summarize",
        top_fit: 0.87,
        ambiguity: 0.11,
      },
    });
    expect(input.candidates[0]).toHaveProperty("match", 0.9);
    expect(input.candidates[0]).toHaveProperty("fit", 0.87);
    expect(input.reasoning).toBe("The top candidate was an AI agent and the task was low risk.");
  });

  it("sums estimates for hybrid decisions", () => {
    const input = decisionResultToPersistenceInput(
      taskRow.id,
      resultFor("hybrid", ["ai-summarize", "h-alice"]),
    );

    expect(input.cost_est).toBe(40.3);
    expect(input.minutes_est).toBe(121);
  });

  it("uses null estimates for escalate and preserves null ambiguity", () => {
    const input = decisionResultToPersistenceInput(taskRow.id, {
      plan: { required: [], risk: "high" },
      scoring: { scorable: false, candidates: [], ambiguity: null, reason: "NO_REQUIRED_CAPABILITIES" },
      route: {
        verdict: "escalate",
        selectedCandidateIds: [],
        reasonCode: "NO_REQUIRED_CAPABILITIES",
        ambiguity: null,
      },
    });

    expect(input.cost_est).toBeNull();
    expect(input.minutes_est).toBeNull();
    expect(input.ambiguity).toBeNull();
    expect(input.reason.ambiguity).toBeNull();
  });

  it("throws a technical mapper error when a selected candidate is missing", () => {
    expect(() =>
      decisionResultToPersistenceInput(taskRow.id, resultFor("ai", ["missing-candidate"])),
    ).toThrow(DecisionMapperError);
  });

  it("does not mutate the engine result", () => {
    const result = resultFor("ai", ["ai-summarize"]);
    const before = structuredClone(result);

    decisionResultToPersistenceInput(taskRow.id, result);

    expect(result).toEqual(before);
  });
});

describe("decisionRowToResponse", () => {
  it("maps persisted rows to API responses", () => {
    const persistence = decisionResultToPersistenceInput(taskRow.id, resultFor("human", ["h-alice"]));
    const row: DecisionRow = {
      ...persistence,
      id: "0ef906bb-5107-480b-b612-1c38bd7a2b36",
      created_at: "2026-07-12T00:00:00.000Z",
    };

    expect(decisionRowToResponse(row)).toEqual(row);
  });
});

describe("formatDecisionReason", () => {
  it("formats every approved reason code deterministically", () => {
    const codes = [
      "NO_REQUIRED_CAPABILITIES",
      "NO_CANDIDATES",
      "TOP_FIT_BELOW_THRESHOLD",
      "AMBIGUOUS_HUMAN_AI_HYBRID",
      "AMBIGUOUS_HUMAN_CANDIDATES",
      "AMBIGUOUS_AI_CANDIDATES",
      "TOP_CANDIDATE_HUMAN",
      "TOP_CANDIDATE_AI_LOW_RISK",
      "HIGH_RISK_AI_REQUIRES_HUMAN",
      "NO_HUMAN_REVIEWER_AVAILABLE",
    ] as const;

    for (const code of codes) {
      expect(formatDecisionReason({ code, selected_candidate_ids: [], ambiguity: null })).toEqual(
        expect.any(String),
      );
    }
  });
});

function resultFor(
  verdict: "human" | "ai" | "hybrid",
  selectedCandidateIds: string[],
): DecisionEngineResultForPersistence {
  const reasonCode =
    verdict === "human"
      ? "TOP_CANDIDATE_HUMAN"
      : verdict === "ai"
        ? "TOP_CANDIDATE_AI_LOW_RISK"
        : "HIGH_RISK_AI_REQUIRES_HUMAN";

  return {
    plan: {
      required: [{ cap: "summarization", weight: 1 }],
      risk: verdict === "hybrid" ? "high" : "low",
    },
    scoring: {
      scorable: true,
      candidates: [scoredAi, scoredHuman],
      ambiguity: 0.11,
    },
    route: {
      verdict,
      selectedCandidateIds,
      reasonCode,
      topCandidateId: "ai-summarize",
      topFit: 0.87,
      ambiguity: 0.11,
    },
  };
}
