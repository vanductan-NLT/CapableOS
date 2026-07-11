import type { DecisionResponse } from "@orchestra/contracts";
import { ApiFail, ok, route } from "../../../../lib/api";
import { requireAuthenticatedUser } from "../../../../lib/auth";
import { toRouteApiFail } from "../../../../lib/decision/api-errors";
import {
  createDecisionRepository,
  type DecisionRepositoryClient,
} from "../../../../lib/decision/repository";
import { decisionIdSchema } from "../../../../lib/schemas";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/decision/:id -> DecisionResponse
export const GET = route<Ctx>(async (_req, ctx) => {
  await requireAuthenticatedUser();
  const { id } = await ctx.params;
  const decisionId = decisionIdSchema.parse(id);

  try {
    const repository = createDecisionRepository(supabaseAdmin() as unknown as DecisionRepositoryClient);
    const decision = await repository.getDecisionById(decisionId);
    if (decision === null) {
      throw new ApiFail("not_found", `Decision ${decisionId} was not found`);
    }

    return ok<DecisionResponse>(decision);
  } catch (error) {
    throw toRouteApiFail(error);
  }
});
