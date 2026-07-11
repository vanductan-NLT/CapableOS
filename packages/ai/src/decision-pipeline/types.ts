import type { PoolCandidate } from "@orchestra/contracts";
import type { PlanInput, PlanOptions, PlanResult } from "../planner";
import type { ScoringResult, ScoringWeights } from "../scoring";
import type { RouteDecisionResult, RouterConfig } from "../router";

export interface DecideTaskInput {
  task: PlanInput;
  candidates: PoolCandidate[];
  plannerOptions: PlanOptions;
  scoringWeights?: ScoringWeights;
  routerConfig?: RouterConfig;
}

export interface DecideTaskResult {
  plan: PlanResult;
  scoring: ScoringResult;
  route: RouteDecisionResult;
}
