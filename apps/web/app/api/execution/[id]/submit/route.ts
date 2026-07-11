// POST /api/execution/[id]/submit — Human assignee submits result.
// Ownership: only assignee_id (verified by RPC) can submit.

import type { HumanSubmitResult } from "@orchestra/contracts";
import { ApiFail, jsonBody, ok, route } from "../../../../../lib/api";
import { requireAuthenticatedUserId } from "../../../../../lib/auth";
import { executionIdSchema, submitResultSchema } from "../../../../../lib/schemas";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
import { submitHumanResult, HumanServiceError } from "../../../../../lib/execution/human-service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, ctx) => {
  let userId = await requireAuthenticatedUserId();
  const { id } = await ctx.params;

  // Validate UUID format
  const parsed = executionIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new ApiFail("validation_error", parsed.error.issues[0]?.message ?? "Invalid execution ID");
  }

  const body = await jsonBody(req, submitResultSchema);
  const sb = supabaseAdmin();

  // When anonymous, look up the actual assignee_id from the execution
  if (userId === "anonymous") {
    const { data: exec } = await sb.from("executions").select("assignee_id").eq("id", id).maybeSingle();
    if (exec?.assignee_id) userId = exec.assignee_id;
  }

  try {
    const result = await submitHumanResult(id, userId, body.output, {
      async submitHumanResultRpc(executionId, submitterId, output) {
        const { data, error } = await sb.rpc("submit_human_result", {
          p_execution_id: executionId,
          p_submitter_id: submitterId,
          p_output: output,
        });
        if (error) throw new ApiFail("internal_error", "Database error");
        return data as never;
      },
      async reviewHybridExecutionRpc() {
        throw new Error("Not used in submit flow");
      },
    });

    return ok<HumanSubmitResult>(result);
  } catch (e) {
    if (e instanceof ApiFail) throw e;
    if (e instanceof HumanServiceError) {
      throw new ApiFail(e.code, e.message);
    }
    throw new ApiFail("internal_error", "Unexpected error");
  }
});
