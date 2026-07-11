// GET /api/execution/[id] — Read execution by ID.
// Ownership: only assignee_id or reviewer_id can view.

import type { Execution } from "@orchestra/contracts";
import { ApiFail, ok, route } from "../../../../lib/api";
import { requireAuthenticatedUserId } from "../../../../lib/auth";
import { executionIdSchema } from "../../../../lib/schemas";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import {
  createExecutionRepository,
  canViewExecution,
  ExecutionRepositoryError,
} from "../../../../lib/execution/execution-repository";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, ctx) => {
  const userId = await requireAuthenticatedUserId();
  const { id } = await ctx.params;

  // Validate UUID format
  const parsed = executionIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new ApiFail("validation_error", parsed.error.issues[0]?.message ?? "Invalid execution ID");
  }

  const sb = supabaseAdmin();
  const repo = createExecutionRepository(sb as never);

  let execution;
  try {
    execution = await repo.getExecutionById(id);
  } catch (e) {
    if (e instanceof ExecutionRepositoryError) {
      throw new ApiFail(e.code, e.message);
    }
    throw e;
  }

  if (!execution) {
    throw new ApiFail("not_found", `Execution ${id} not found`);
  }

  // Ownership check: only assignee or reviewer can view
  if (!canViewExecution(execution, userId)) {
    throw new ApiFail("forbidden", "You do not have access to this execution");
  }

  const response: Execution = {
    id: execution.id,
    task_id: execution.task_id,
    decision_id: execution.decision_id ?? "",
    verdict: execution.verdict!,
    executor: execution.executor,
    assignee_id: execution.assignee_id,
    reviewer_id: execution.reviewer_id,
    status: execution.status,
    attempt: execution.attempt,
    max_retries: execution.max_retries,
    root_execution_id: execution.root_execution_id ?? execution.id,
    previous_execution_id: execution.previous_execution_id,
    input: execution.input,
    output: execution.output,
    error_code: execution.error_code,
    error_message: execution.error_message,
    tokens: execution.tokens,
    cost: execution.cost,
    ms: execution.ms,
    trace_id: execution.trace_id ?? "",
    timeout_at: execution.timeout_at,
    started_at: execution.started_at,
    completed_at: execution.completed_at,
    created_at: execution.created_at,
  };

  return ok<Execution>(response);
});
