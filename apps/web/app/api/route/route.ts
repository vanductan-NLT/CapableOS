import type { DecisionResponse } from "@orchestra/contracts";
import { jsonBody, ok, route } from "../../../lib/api";
import { requireAuthenticatedUser } from "../../../lib/auth";
import { toRouteApiFail } from "../../../lib/decision/api-errors";
import { createQwenPlannerOptions } from "../../../lib/decision/planner-options";
import { createProductionRouteDecisionService } from "../../../lib/decision/production-service";
import { routeRequestSchema } from "../../../lib/schemas";

// POST /api/route { task_id } -> DecisionResponse
export const POST = route(async (req: Request) => {
  await requireAuthenticatedUser();
  const body = await jsonBody(req, routeRequestSchema);

  try {
    const service = createProductionRouteDecisionService(createQwenPlannerOptions);
    const decision = await service.routeTask(body.task_id);
    return ok<DecisionResponse>(decision);
  } catch (error) {
    throw toRouteApiFail(error);
  }
});
