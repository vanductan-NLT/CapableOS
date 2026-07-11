// POST /api/execution/[id]/review — Hybrid reviewer approves/rejects AI output.
// Ownership: only reviewer_id (verified by RPC) can review.

import type { ReviewResult } from "@orchestra/contracts";
import { ApiFail, jsonBody, ok, route } from "../../../../../lib/api";
import { requireAuthenticatedUserId } from "../../../../../lib/auth";
import { executionIdSchema, reviewSchema } from "../../../../../lib/schemas";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
import { reviewHybridExecution, HumanServiceError } from "../../../../../lib/execution/human-service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, ctx) => {
  const userId = await requireAuthenticatedUserId();
  const { id } = await ctx.params;

  // Validate UUID format
  const parsed = executionIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new ApiFail("validation_error", parsed.error.issues[0]?.message ?? "Invalid execution ID");
  }

  const body = await jsonBody(req, reviewSchema);
  const sb = supabaseAdmin();

  try {
    const result = await reviewHybridExecution(id, userId, body.outcome, body.note ?? null, {
      async submitHumanResultRpc() {
        throw new Error("Not used in review flow");
      },
      async reviewHybridExecutionRpc(executionId, reviewerId, outcome, note) {
        const { data, error } = await sb.rpc("review_hybrid_execution", {
          p_execution_id: executionId,
          p_reviewer_id: reviewerId,
          p_outcome: outcome,
          p_note: note,
        });
        if (error) throw new ApiFail("internal_error", "Database error");
        return data as never;
      },
    });

    return ok<ReviewResult>(result);
  } catch (e) {
    if (e instanceof ApiFail) throw e;
    if (e instanceof HumanServiceError) {
      throw new ApiFail(e.code, e.message);
    }
    throw new ApiFail("internal_error", "Unexpected error");
  }
});
