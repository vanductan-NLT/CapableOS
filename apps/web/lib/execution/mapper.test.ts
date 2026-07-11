import { describe, expect, it } from "vitest";
import type { DecisionResponse } from "@orchestra/contracts";
import { ExecutionMapperError, mapDecisionToExecution, resolveExecutorFromCapabilities } from "./mapper";

// ── Test fixtures ───────────────────────────────────────────

function makeDecision(overrides: Partial<DecisionResponse> = {}): DecisionResponse {
  return {
    id: "decision-001",
    task_id: "task-001",
    required: [{ cap: "summarization", weight: 0.8 }],
    risk: "low",
    candidates: [
      {
        id: "ai-summarize",
        type: "ai",
        name: "Summarizer",
        trust: 90,
        normalizedTrust: 0.9,
        cost: 0.3,
        minutes: 1,
        match: 0.85,
        fit: 0.87,
      },
    ],
    verdict: "ai",
    chosen: ["ai-summarize"],
    confidence: null,
    ambiguity: null,
    reason: {
      code: "TOP_CANDIDATE_AI_LOW_RISK",
      selected_candidate_ids: ["ai-summarize"],
      top_candidate_id: "ai-summarize",
      top_fit: 0.87,
      ambiguity: null,
    },
    reasoning: "The top candidate was an AI agent and the task was low risk.",
    governance: null,
    cost_est: 0.3,
    minutes_est: 1,
    estimated: true,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ── AI verdict tests ────────────────────────────────────────

describe("mapDecisionToExecution — ai verdict", () => {
  it("maps AI decision with explicit executor override", () => {
    const decision = makeDecision({ verdict: "ai", chosen: ["ai-summarize"] });
    const result = mapDecisionToExecution(decision, { executor: "summarize" });

    expect(result).toEqual({
      task_id: "task-001",
      decision_id: "decision-001",
      verdict: "ai",
      executor: "summarize",
      assignee_id: "ai-summarize",
      reviewer_id: null,
      input: null,
      max_retries: 2,
      timeout_ms: 30_000,
    });
  });

  it("auto-resolves executor from summarization capability", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-summarize"],
      required: [{ cap: "summarization", weight: 0.9 }],
    });
    const result = mapDecisionToExecution(decision);

    expect(result.executor).toBe("summarize");
  });

  it("auto-resolves executor from research capability", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-research"],
      required: [{ cap: "research", weight: 0.8 }],
    });
    const result = mapDecisionToExecution(decision);

    expect(result.executor).toBe("research");
  });

  it("auto-resolves executor from email_drafting capability", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-email"],
      required: [{ cap: "email_drafting", weight: 0.7 }],
    });
    const result = mapDecisionToExecution(decision);

    expect(result.executor).toBe("email");
  });

  it("auto-resolves executor from translation capability", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-translate"],
      required: [{ cap: "translation", weight: 0.6 }],
    });
    const result = mapDecisionToExecution(decision);

    expect(result.executor).toBe("translate");
  });

  it("auto-resolves executor from meeting_notes capability", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-meeting"],
      required: [{ cap: "meeting_notes", weight: 0.5 }],
    });
    const result = mapDecisionToExecution(decision);

    expect(result.executor).toBe("meeting");
  });

  it("picks highest-weight supported capability when multiple present", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-agent"],
      required: [
        { cap: "writing", weight: 0.6 },        // no executor (human-only)
        { cap: "research", weight: 0.3 },        // has executor
        { cap: "summarization", weight: 0.5 },   // has executor, higher weight
      ],
    });
    const result = mapDecisionToExecution(decision);

    expect(result.executor).toBe("summarize"); // summarization (0.5) > research (0.3)
  });

  it("throws config error when no supported capability present", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-agent"],
      required: [
        { cap: "writing", weight: 0.7 },
        { cap: "coding", weight: 0.3 },
      ],
    });

    expect(() => mapDecisionToExecution(decision)).toThrow(ExecutionMapperError);
    expect(() => mapDecisionToExecution(decision)).toThrow(
      /No supported capability found/,
    );
  });

  it("explicit executor override takes priority over auto-resolve", () => {
    const decision = makeDecision({
      verdict: "ai",
      chosen: ["ai-agent"],
      required: [{ cap: "summarization", weight: 0.9 }],
    });
    const result = mapDecisionToExecution(decision, { executor: "research" });

    expect(result.executor).toBe("research"); // override wins
  });

  it("uses provided input", () => {
    const decision = makeDecision({ verdict: "ai", chosen: ["ai-summarize"] });
    const input = { document_url: "https://example.com/doc.pdf" };
    const result = mapDecisionToExecution(decision, { executor: "summarize", input });

    expect(result.input).toEqual(input);
  });

  it("respects custom timeout_ms", () => {
    const decision = makeDecision({ verdict: "ai", chosen: ["ai-summarize"] });
    const result = mapDecisionToExecution(decision, { executor: "research", timeout_ms: 60_000 });

    expect(result.timeout_ms).toBe(60_000);
  });

  it("defaults max_retries to 2 for AI", () => {
    const decision = makeDecision({ verdict: "ai", chosen: ["ai-summarize"] });
    const result = mapDecisionToExecution(decision, { executor: "summarize" });

    expect(result.max_retries).toBe(2);
  });
});

// ── Human verdict tests ─────────────────────────────────────

describe("mapDecisionToExecution — human verdict", () => {
  it("maps human decision with null executor", () => {
    const decision = makeDecision({
      verdict: "human",
      chosen: ["human-alice"],
      reason: {
        code: "TOP_CANDIDATE_HUMAN",
        selected_candidate_ids: ["human-alice"],
        top_candidate_id: "human-alice",
        top_fit: 0.9,
        ambiguity: null,
      },
    });
    const result = mapDecisionToExecution(decision);

    expect(result).toEqual({
      task_id: "task-001",
      decision_id: "decision-001",
      verdict: "human",
      executor: null,
      assignee_id: "human-alice",
      reviewer_id: null,
      input: null,
      max_retries: 0,
      timeout_ms: undefined,
    });
  });

  it("defaults max_retries to 0 for human", () => {
    const decision = makeDecision({ verdict: "human", chosen: ["human-bob"] });
    const result = mapDecisionToExecution(decision);

    expect(result.max_retries).toBe(0);
  });

  it("has no timeout for human", () => {
    const decision = makeDecision({ verdict: "human", chosen: ["human-bob"] });
    const result = mapDecisionToExecution(decision);

    expect(result.timeout_ms).toBeUndefined();
  });
});

// ── Hybrid verdict tests ────────────────────────────────────

describe("mapDecisionToExecution — hybrid verdict", () => {
  it("maps hybrid with AI assignee and human reviewer", () => {
    const decision = makeDecision({
      verdict: "hybrid",
      chosen: ["ai-summarize", "human-reviewer"],
      reason: {
        code: "HIGH_RISK_AI_REQUIRES_HUMAN",
        selected_candidate_ids: ["ai-summarize", "human-reviewer"],
        top_candidate_id: "ai-summarize",
        top_fit: 0.87,
        ambiguity: null,
      },
    });
    const result = mapDecisionToExecution(decision, { executor: "summarize" });

    expect(result.assignee_id).toBe("ai-summarize");
    expect(result.reviewer_id).toBe("human-reviewer");
    expect(result.verdict).toBe("hybrid");
    expect(result.executor).toBe("summarize");
    expect(result.max_retries).toBe(2);
    expect(result.timeout_ms).toBe(30_000);
  });

  it("auto-resolves executor for hybrid from capabilities", () => {
    const decision = makeDecision({
      verdict: "hybrid",
      chosen: ["ai-summarize", "human-reviewer"],
      required: [{ cap: "summarization", weight: 0.9 }],
    });
    const result = mapDecisionToExecution(decision);

    expect(result.executor).toBe("summarize");
  });

  it("throws when hybrid has fewer than 2 chosen candidates", () => {
    const decision = makeDecision({
      verdict: "hybrid",
      chosen: ["ai-summarize"], // missing reviewer
    });

    expect(() => mapDecisionToExecution(decision, { executor: "summarize" })).toThrow(
      ExecutionMapperError,
    );
    expect(() => mapDecisionToExecution(decision, { executor: "summarize" })).toThrow(
      /at least 2 chosen candidates/,
    );
  });
});

// ── Escalate verdict tests ──────────────────────────────────

describe("mapDecisionToExecution — escalate verdict", () => {
  it("throws for escalate verdict", () => {
    const decision = makeDecision({
      verdict: "escalate",
      chosen: [],
      reason: {
        code: "TOP_FIT_BELOW_THRESHOLD",
        selected_candidate_ids: [],
        ambiguity: null,
      },
    });

    expect(() => mapDecisionToExecution(decision)).toThrow(ExecutionMapperError);
    expect(() => mapDecisionToExecution(decision)).toThrow(
      /Cannot create execution for verdict "escalate"/,
    );
  });
});

// ── Edge cases ──────────────────────────────────────────────

describe("mapDecisionToExecution — edge cases", () => {
  it("handles empty chosen array for AI (assignee_id = null)", () => {
    const decision = makeDecision({ verdict: "ai", chosen: [] });
    const result = mapDecisionToExecution(decision, { executor: "research" });

    expect(result.assignee_id).toBeNull();
  });

  it("input defaults to null when not provided", () => {
    const decision = makeDecision({ verdict: "human", chosen: ["human-alice"] });
    const result = mapDecisionToExecution(decision);

    expect(result.input).toBeNull();
  });
});

// ── resolveExecutorFromCapabilities (exported helper) ────────

describe("resolveExecutorFromCapabilities", () => {
  it("returns executor for single supported capability", () => {
    expect(resolveExecutorFromCapabilities([{ cap: "research", weight: 1.0 }])).toBe("research");
  });

  it("picks highest weight among supported", () => {
    const result = resolveExecutorFromCapabilities([
      { cap: "translation", weight: 0.4 },
      { cap: "email_drafting", weight: 0.6 },
    ]);
    expect(result).toBe("email");
  });

  it("skips unsupported capabilities", () => {
    const result = resolveExecutorFromCapabilities([
      { cap: "design", weight: 0.9 },
      { cap: "meeting_notes", weight: 0.1 },
    ]);
    expect(result).toBe("meeting");
  });

  it("throws when no capability has an executor", () => {
    expect(() =>
      resolveExecutorFromCapabilities([
        { cap: "writing", weight: 0.5 },
        { cap: "analysis", weight: 0.5 },
      ]),
    ).toThrow(ExecutionMapperError);
  });

  it("throws on empty required array", () => {
    expect(() => resolveExecutorFromCapabilities([])).toThrow(ExecutionMapperError);
  });
});
