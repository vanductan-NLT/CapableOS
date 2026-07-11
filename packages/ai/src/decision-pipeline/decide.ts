import { plan as planTask } from "../planner";
import { routeDecision } from "../router";
import { scoreCandidates } from "../scoring";
import type { DecideTaskInput, DecideTaskResult } from "./types";

export async function decideTask(input: DecideTaskInput): Promise<DecideTaskResult> {
  const planResult = await planTask(input.task, input.plannerOptions);

  const scoring = scoreCandidates({
    required: planResult.required,
    candidates: input.candidates,
    weights: input.scoringWeights,
  });

  const route = routeDecision({
    risk: planResult.risk,
    scoring,
    config: input.routerConfig,
  });

  return {
    plan: planResult,
    scoring,
    route,
  };
}
