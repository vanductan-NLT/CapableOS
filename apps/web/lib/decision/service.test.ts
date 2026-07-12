import { describe, expect, it, vi } from "vitest";
import type { DecideTaskInput, DecideTaskResult, PlanOptions } from "@orchestra/ai";
import type { AgentRow, TaskRow } from "@/lib/db-types";
import type { DecisionPersistenceInput, DecisionResponse } from "@orchestra/contracts";
import {
  RouteDecisionServiceError,
  routeTaskDecision,
  type DecisionRepositoryForService,
  type RouteDecisionServiceDeps,
} from "./service";

const taskId = "9a06c23e-1c6e-4b2a-9a61-51b8f8f7ff30";
const decisionId = "0ef906bb-5107-480b-b612-1c38bd7a2b36";

const taskRow: TaskRow = {
  id: taskId,
  title: "Summarize notes",
  description: "Make it concise",
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
  caps: { summarization: 0.9 },
  created_at: "2026-07-12T00:00:00.000Z",
};

const engineResult: DecideTaskResult = {
  plan: {
    required: [{ cap: "summarization", weight: 1 }],
    risk: "low",
  },
  scoring: {
    scorable: true,
    candidates: [
      {
        id: "ai-summarize",
        type: "ai",
        name: "Summarizer",
        trust: 80,
        normalizedTrust: 0.8,
        cost: 0.3,
        minutes: 1,
        match: 0.9,
        fit: 0.87,
      },
    ],
    ambiguity: null,
  },
  route: {
    verdict: "ai",
    selectedCandidateIds: ["ai-summarize"],
    reasonCode: "TOP_CANDIDATE_AI_LOW_RISK",
    topCandidateId: "ai-summarize",
    topFit: 0.87,
    ambiguity: null,
  },
};

const decisionResponse: DecisionResponse = {
  id: decisionId,
  task_id: taskId,
  required: engineResult.plan.required,
  risk: "low",
  candidates: engineResult.scoring.candidates,
  verdict: "ai",
  chosen: ["ai-summarize"],
  confidence: 0.87,
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
  created_at: "2026-07-12T00:00:00.000Z",
};

const plannerOptions = { model: {} } as PlanOptions;

describe("routeTaskDecision", () => {
  it("routes a task through loaders, engine, mapper, and repository", async () => {
    const deps = depsFor();

    const result = await routeTaskDecision(taskId, deps);

    expect(result).toEqual(decisionResponse);
    expect(deps.loadTask).toHaveBeenCalledWith(taskId);
    expect(deps.loadAgentPool).toHaveBeenCalledOnce();
    expect(deps.getPlannerOptions).toHaveBeenCalledOnce();
    expect(deps.decideTask).toHaveBeenCalledOnce();
    expect(deps.decideTask).toHaveBeenCalledWith({
      task: { title: "Summarize notes", description: "Make it concise" },
      candidates: [
        {
          id: "ai-summarize",
          type: "ai",
          name: "Summarizer",
          trust: 80,
          cost: 0.3,
          minutes: 1,
          caps: { summarization: 0.9 },
        },
      ],
      plannerOptions,
    });
    expect(deps.decisionRepository.persistRouteDecision).toHaveBeenCalledOnce();
  });

  it("early returns existing decisions without loading agents or calling the engine", async () => {
    const deps = depsFor({
      task: { ...taskRow, decision_id: decisionId, status: "routed" },
      existingDecision: decisionResponse,
    });

    const result = await routeTaskDecision(taskId, deps);

    expect(result).toEqual(decisionResponse);
    expect(deps.decisionRepository.getDecisionById).toHaveBeenCalledWith(decisionId);
    expect(deps.loadAgentPool).not.toHaveBeenCalled();
    expect(deps.getPlannerOptions).not.toHaveBeenCalled();
    expect(deps.decideTask).not.toHaveBeenCalled();
    expect(deps.decisionRepository.persistRouteDecision).not.toHaveBeenCalled();
  });

  it("treats a dangling task decision_id as a technical consistency error", async () => {
    const deps = depsFor({
      task: { ...taskRow, decision_id: decisionId },
      existingDecision: null,
    });

    await expect(routeTaskDecision(taskId, deps)).rejects.toMatchObject({
      code: "internal_error",
    });
    expect(deps.loadAgentPool).not.toHaveBeenCalled();
    expect(deps.decideTask).not.toHaveBeenCalled();
  });

  it("does not call the engine when task is missing", async () => {
    const deps = depsFor({ task: null });

    await expect(routeTaskDecision(taskId, deps)).rejects.toMatchObject({
      code: "not_found",
    });
    expect(deps.decideTask).not.toHaveBeenCalled();
  });

  it("passes empty pools through the engine so business escalate can persist", async () => {
    const escalateResult: DecideTaskResult = {
      plan: { required: [{ cap: "summarization", weight: 1 }], risk: "high" },
      scoring: { scorable: false, candidates: [], ambiguity: null, reason: "NO_CANDIDATES" },
      route: {
        verdict: "escalate",
        selectedCandidateIds: [],
        reasonCode: "NO_CANDIDATES",
        ambiguity: null,
      },
    };
    const deps = depsFor({
      agents: [],
      engine: escalateResult,
      decision: { ...decisionResponse, verdict: "escalate", candidates: [], chosen: [], cost_est: null, minutes_est: null },
    });

    const result = await routeTaskDecision(taskId, deps);

    expect(result.verdict).toBe("escalate");
    expect(deps.decideTask).toHaveBeenCalledOnce();
    expect(deps.decisionRepository.persistRouteDecision).toHaveBeenCalledOnce();
  });

  it("treats invalid agent data as technical and does not call decideTask", async () => {
    const deps = depsFor({ agents: [{ ...agentRow, cost: null }] });

    await expect(routeTaskDecision(taskId, deps)).rejects.toThrow("Invalid cost");
    expect(deps.decideTask).not.toHaveBeenCalled();
    expect(deps.decisionRepository.persistRouteDecision).not.toHaveBeenCalled();
  });

  it("maps decideTask failures to upstream_error and does not persist", async () => {
    const deps = depsFor();
    deps.decideTask.mockRejectedValueOnce(new Error("model unavailable"));

    await expect(routeTaskDecision(taskId, deps)).rejects.toMatchObject({
      code: "upstream_error",
      message: "Planner provider is not available",
    });
    expect(deps.decisionRepository.persistRouteDecision).not.toHaveBeenCalled();
  });

  it("propagates repository technical failures", async () => {
    const deps = depsFor();
    deps.decisionRepository.persistRouteDecision.mockRejectedValueOnce(new Error("rpc failed"));

    await expect(routeTaskDecision(taskId, deps)).rejects.toThrow("rpc failed");
  });
});

function depsFor(overrides: {
  task?: TaskRow | null;
  agents?: AgentRow[];
  engine?: DecideTaskResult;
  decision?: DecisionResponse;
  existingDecision?: DecisionResponse | null;
} = {}) {
  const decision = overrides.decision ?? decisionResponse;
  const repository: MockRepository = {
    getDecisionById: vi.fn().mockResolvedValue(overrides.existingDecision ?? null),
    persistRouteDecision: vi.fn(async (input: DecisionPersistenceInput) => ({
      kind: "created" as const,
      decision: { ...decision, task_id: input.task_id },
    })),
  };

  return {
    loadTask: vi.fn().mockResolvedValue(overrides.task === undefined ? taskRow : overrides.task),
    loadAgentPool: vi.fn().mockResolvedValue(overrides.agents ?? [agentRow]),
    getPlannerOptions: vi.fn().mockResolvedValue(plannerOptions),
    decideTask: vi.fn(async (_input: DecideTaskInput) => overrides.engine ?? engineResult),
    decisionRepository: repository,
  };
}

type MockRepository = {
  getDecisionById: ReturnType<typeof vi.fn<DecisionRepositoryForService["getDecisionById"]>>;
  persistRouteDecision: ReturnType<typeof vi.fn<DecisionRepositoryForService["persistRouteDecision"]>>;
};
