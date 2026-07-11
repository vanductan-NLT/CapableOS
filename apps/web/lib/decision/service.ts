import type { DecideTaskInput, DecideTaskResult, PlanOptions } from "@orchestra/ai";
import type { ApiErrorCode, DecisionPersistenceInput, DecisionResponse } from "@orchestra/contracts";
import type { AgentRow, TaskRow } from "../db-types";
import {
  agentRowToPoolCandidate,
  decisionResultToPersistenceInput,
  taskRowToPlanInput,
} from "./mapper";
import type { PersistRouteDecisionResult } from "./repository";

export interface RouteDecisionService {
  routeTask(taskId: string): Promise<DecisionResponse>;
}

export interface DecisionRepositoryForService {
  getDecisionById(id: string): Promise<DecisionResponse | null>;
  persistRouteDecision(input: DecisionPersistenceInput): Promise<PersistRouteDecisionResult>;
}

export interface RouteDecisionServiceDeps {
  loadTask(taskId: string): Promise<TaskRow | null>;
  loadAgentPool(): Promise<AgentRow[]>;
  getPlannerOptions(): PlanOptions | Promise<PlanOptions>;
  decideTask(input: DecideTaskInput): Promise<DecideTaskResult>;
  decisionRepository: DecisionRepositoryForService;
}

export class RouteDecisionServiceError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RouteDecisionServiceError";
  }
}

export function createRouteDecisionService(deps: RouteDecisionServiceDeps): RouteDecisionService {
  return {
    routeTask(taskId: string) {
      return routeTaskDecision(taskId, deps);
    },
  };
}

export async function routeTaskDecision(
  taskId: string,
  deps: RouteDecisionServiceDeps,
): Promise<DecisionResponse> {
  const task = await deps.loadTask(taskId);
  if (task === null) {
    throw new RouteDecisionServiceError("not_found", `Task ${taskId} was not found`);
  }

  if (task.decision_id !== null) {
    const existing = await deps.decisionRepository.getDecisionById(task.decision_id);
    if (existing === null) {
      throw new RouteDecisionServiceError(
        "internal_error",
        `Task ${task.id} points to missing decision ${task.decision_id}`,
      );
    }

    return existing;
  }

  const agents = await deps.loadAgentPool();
  const candidates = agents.map(agentRowToPoolCandidate);
  const plannerOptions = await deps.getPlannerOptions();
  let engineResult: DecideTaskResult;
  try {
    engineResult = await deps.decideTask({
      task: taskRowToPlanInput(task),
      candidates,
      plannerOptions,
    });
  } catch {
    throw new RouteDecisionServiceError("upstream_error", "Planner provider is not available");
  }
  const persistenceInput = decisionResultToPersistenceInput(task.id, engineResult);
  const persisted = await deps.decisionRepository.persistRouteDecision(persistenceInput);

  return persisted.decision;
}
