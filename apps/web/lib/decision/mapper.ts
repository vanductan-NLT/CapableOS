import {
  isCapability,
  type DecisionPersistenceInput,
  type DecisionResponse,
  type PoolCandidate,
  type RequiredCapability,
  type Risk,
  type RouterReasonCode,
  type ScoredCandidate,
  type StructuredDecisionReason,
  type Verdict,
} from "@orchestra/contracts";
import type { AgentRow, DecisionRow, TaskRow } from "@/lib/db-types";

export interface PlannerTaskInput {
  title: string;
  description?: string;
}

export interface DecisionEngineResultForPersistence {
  plan: {
    required: RequiredCapability[];
    risk: Risk;
  };
  scoring: {
    candidates: ScoredCandidate[];
    scorable?: boolean;
    ambiguity?: number | null;
    reason?: string;
  };
  route: RouteResultForPersistence;
}

export interface RouteResultForPersistence {
  verdict: Verdict;
  selectedCandidateIds: string[];
  reasonCode: RouterReasonCode;
  topCandidateId?: string;
  topFit?: number;
  ambiguity: number | null;
}

export class DecisionMapperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecisionMapperError";
  }
}

export function taskRowToPlanInput(task: Pick<TaskRow, "title" | "description">): PlannerTaskInput {
  return {
    title: task.title,
    description: task.description ?? undefined,
  };
}

export function agentRowToPoolCandidate(agent: AgentRow): PoolCandidate {
  validateAgentType(agent);
  validateFiniteRange(agent.trust, "trust", agent.id, 0, 100);
  validateRequiredNonNegative(agent.cost, "cost", agent.id);
  validateRequiredNonNegative(agent.minutes, "minutes", agent.id);
  validateCaps(agent);

  return {
    id: agent.id,
    type: agent.type,
    name: agent.name,
    trust: agent.trust,
    cost: agent.cost,
    minutes: agent.minutes,
    caps: agent.caps,
  };
}

export function decisionResultToPersistenceInput(
  taskId: string,
  result: DecisionEngineResultForPersistence,
): DecisionPersistenceInput {
  const reason = routeToStructuredReason(result.route);
  const estimates = estimateCostAndMinutes(result.route, result.scoring.candidates);

  return {
    task_id: taskId,
    required: result.plan.required,
    risk: result.plan.risk,
    candidates: result.scoring.candidates,
    verdict: result.route.verdict,
    chosen: result.route.selectedCandidateIds,
    confidence: null,
    ambiguity: result.route.ambiguity,
    reason,
    reasoning: formatDecisionReason(reason),
    governance: null,
    cost_est: estimates.cost_est,
    minutes_est: estimates.minutes_est,
    estimated: true,
  };
}

export function decisionRowToResponse(row: DecisionRow): DecisionResponse {
  return {
    id: row.id,
    task_id: row.task_id,
    required: row.required,
    risk: row.risk,
    candidates: row.candidates,
    verdict: row.verdict,
    chosen: row.chosen,
    confidence: row.confidence,
    ambiguity: row.ambiguity,
    reason: row.reason,
    reasoning: row.reasoning,
    governance: row.governance,
    cost_est: row.cost_est,
    minutes_est: row.minutes_est,
    estimated: row.estimated,
    created_at: row.created_at,
  };
}

export function routeToStructuredReason(route: RouteResultForPersistence): StructuredDecisionReason {
  return {
    code: route.reasonCode,
    selected_candidate_ids: route.selectedCandidateIds,
    top_candidate_id: route.topCandidateId,
    top_fit: route.topFit,
    ambiguity: route.ambiguity,
  };
}

export function formatDecisionReason(reason: StructuredDecisionReason): string {
  switch (reason.code) {
    case "NO_REQUIRED_CAPABILITIES":
      return "No required capabilities could be determined.";
    case "NO_CANDIDATES":
      return "No eligible candidates were available.";
    case "TOP_FIT_BELOW_THRESHOLD":
      return "The top candidate fit was below the routing threshold.";
    case "AMBIGUOUS_HUMAN_AI_HYBRID":
      return "The top human and AI candidates were too close to choose one.";
    case "AMBIGUOUS_HUMAN_CANDIDATES":
      return "The top human candidates were too close to choose one.";
    case "AMBIGUOUS_AI_CANDIDATES":
      return "The top AI candidates were too close to choose one.";
    case "TOP_CANDIDATE_HUMAN":
      return "The top candidate was a human.";
    case "TOP_CANDIDATE_AI_LOW_RISK":
      return "The top candidate was an AI agent and the task was low risk.";
    case "HIGH_RISK_AI_REQUIRES_HUMAN":
      return "The top candidate was an AI agent and high risk requires human review.";
    case "NO_HUMAN_REVIEWER_AVAILABLE":
      return "No human reviewer was available for a high-risk AI route.";
  }
}

function estimateCostAndMinutes(
  route: RouteResultForPersistence,
  candidates: ScoredCandidate[],
): Pick<DecisionPersistenceInput, "cost_est" | "minutes_est"> {
  if (route.verdict === "escalate") {
    return { cost_est: null, minutes_est: null };
  }

  const selected = route.selectedCandidateIds.map((id) => {
    const candidate = candidates.find((item) => item.id === id);
    if (candidate === undefined) {
      throw new DecisionMapperError(`Selected candidate "${id}" was not found in scoring results`);
    }
    return candidate;
  });

  return {
    cost_est: selected.reduce((sum, candidate) => sum + candidate.cost, 0),
    minutes_est: selected.reduce((sum, candidate) => sum + candidate.minutes, 0),
  };
}

function validateAgentType(agent: AgentRow): void {
  if (agent.type !== "human" && agent.type !== "ai") {
    throw new DecisionMapperError(`Invalid agent type for "${agent.id}": ${String(agent.type)}`);
  }
}

function validateRequiredNonNegative(
  value: number | null,
  field: "cost" | "minutes",
  agentId: string,
): asserts value is number {
  if (value === null) {
    throw new DecisionMapperError(`Invalid ${field} for agent "${agentId}": value is required`);
  }

  validateFiniteRange(value, field, agentId, 0, Number.POSITIVE_INFINITY);
}

function validateFiniteRange(
  value: number,
  field: string,
  agentId: string,
  min: number,
  max: number,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new DecisionMapperError(
      `Invalid ${field} for agent "${agentId}": expected ${min}..${max}, received ${String(value)}`,
    );
  }
}

function validateCaps(agent: AgentRow): void {
  for (const [cap, score] of Object.entries(agent.caps ?? {})) {
    if (!isCapability(cap)) {
      throw new DecisionMapperError(`Invalid capability key for agent "${agent.id}": ${cap}`);
    }

    validateFiniteRange(score, `capability "${cap}"`, agent.id, 0, 1);
  }
}
