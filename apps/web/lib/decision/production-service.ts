import { decideTask, type PlanOptions } from "@orchestra/ai";
import { supabaseAdmin } from "../supabase/admin";
import { loadAgentPool, loadTaskById, type DecisionLoaderClient } from "./loaders";
import {
  createDecisionRepository,
  type DecisionRepositoryClient,
} from "./repository";
import {
  createRouteDecisionService,
  type RouteDecisionService,
  type RouteDecisionServiceDeps,
} from "./service";

export type PlannerOptionsFactory = () => PlanOptions | Promise<PlanOptions>;

export function createProductionRouteDecisionService(
  getPlannerOptions: PlannerOptionsFactory,
  client?: DecisionLoaderClient & DecisionRepositoryClient,
): RouteDecisionService {
  const resolvedClient = client ?? (supabaseAdmin() as unknown as DecisionLoaderClient & DecisionRepositoryClient);

  return createRouteDecisionService({
    loadTask: (taskId) => loadTaskById(resolvedClient, taskId),
    loadAgentPool: () => loadAgentPool(resolvedClient),
    getPlannerOptions: getPlannerOptions satisfies RouteDecisionServiceDeps["getPlannerOptions"],
    decideTask,
    decisionRepository: createDecisionRepository(resolvedClient),
  });
}
