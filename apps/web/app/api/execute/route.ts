// POST /api/execute — Create + run execution for a decision.
// Owner: A (execution domain). Cross-domain: updates task status via RPC.

import type { ExecuteResponse } from "@orchestra/contracts";
import { ApiFail, jsonBody, ok, route } from "../../../lib/api";
import { requireAuthenticatedUserId } from "../../../lib/auth";
import { executeSchema } from "../../../lib/schemas";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { mapDecisionToExecution, ExecutionMapperError } from "../../../lib/execution/mapper";
import {
  createExecutionRepository,
  ExecutionRepositoryError,
} from "../../../lib/execution/execution-repository";
import { runExecution, type ExecutionRecord } from "../../../lib/execution/executor-service";
import { createQwenPlannerOptions } from "../../../lib/decision/planner-options";
import type { ExecutionRow } from "../../../lib/db-types";

export const POST = route(async (req: Request) => {
  await requireAuthenticatedUserId();
  const body = await jsonBody(req, executeSchema);

  const sb = supabaseAdmin();
  const repo = createExecutionRepository(sb as never);

  // 1. Load decision
  const decision = await repo.getDecisionById(body.decision_id);
  if (!decision) {
    throw new ApiFail("not_found", `Decision ${body.decision_id} not found`);
  }

  // 2. Escalate → business outcome, no execution
  if (decision.verdict === "escalate") {
    const response: ExecuteResponse = {
      kind: "escalate",
      execution_id: null,
      verdict: "escalate",
      reason: "Decision requires manager review",
    };
    return ok(response);
  }

  // 3. Map decision → execution input
  let executionInput;
  try {
    executionInput = mapDecisionToExecution(decision, { input: body.input });
  } catch (e) {
    if (e instanceof ExecutionMapperError) {
      throw new ApiFail("conflict", e.message);
    }
    throw e;
  }

  // 4. Create execution idempotently via RPC
  const traceId = crypto.randomUUID();
  let rpcResult;
  try {
    rpcResult = await repo.createExecution(
      decision.task_id,
      decision.id,
      executionInput,
      traceId,
    );
  } catch (e) {
    if (e instanceof ExecutionRepositoryError) {
      throw new ApiFail(e.code, e.message);
    }
    throw e;
  }

  // 5. Handle RPC result
  switch (rpcResult.status) {
    case "not_found":
      throw new ApiFail("not_found", `Task ${decision.task_id} not found`);

    case "conflict":
      throw new ApiFail("conflict", `Task cannot be executed from status "${rpcResult.task_status}"`);

    case "invalid_verdict":
      throw new ApiFail("conflict", `Invalid verdict for execution: "${rpcResult.verdict}"`);

    case "existing": {
      // Return existing execution — do NOT re-run
      const existing = rpcResult.execution;
      const response: ExecuteResponse = {
        kind: "existing",
        execution_id: existing.id,
        verdict: existing.verdict!,
        status: existing.status,
      };
      return ok(response);
    }

    case "created":
      break; // continue to verdict-specific behavior
  }

  const execution = rpcResult.execution;

  // 6. Verdict-specific behavior
  if (decision.verdict === "human") {
    const response: ExecuteResponse = {
      kind: "human_pending",
      execution_id: execution.id,
      verdict: "human",
      status: "pending",
      assignee_id: execution.assignee_id ?? "",
    };
    return ok(response);
  }

  // AI or hybrid — run executor
  try {
    const { model } = createQwenPlannerOptions();
    const record: ExecutionRecord = {
      id: execution.id,
      task_id: execution.task_id,
      decision_id: execution.decision_id ?? "",
      executor: execution.executor!,
      status: execution.status,
      attempt: execution.attempt,
      max_retries: execution.max_retries,
      root_execution_id: execution.root_execution_id ?? execution.id,
      input: execution.input,
      trace_id: execution.trace_id ?? traceId,
      timeout_at: execution.timeout_at,
    };

    const result = await runExecution(record, model, {
      async transitionExecution(id, event, payload) {
        const { data, error } = await sb.rpc("transition_execution", {
          p_execution_id: id,
          p_event: event,
          p_payload: payload,
        });
        if (error) throw new ExecutionRepositoryError("internal_error", error.message);
        const res = data as { status: string; task_status_update?: string; current_status?: string; event?: string };
        if (res.status === "transitioned") {
          return { status: "transitioned" as const, task_status_update: res.task_status_update ?? "none" };
        }
        if (res.status === "not_found") {
          return { status: "not_found" as const };
        }
        return { status: "invalid_transition" as const, current_status: res.current_status ?? "", event: res.event ?? "" };
      },
      async createRetryExecution(input) {
        const retryPayload = {
          verdict: decision.verdict,
          executor: input.executor,
          assignee_id: execution.assignee_id,
          reviewer_id: execution.reviewer_id,
          attempt: input.attempt,
          max_retries: input.max_retries,
          root_execution_id: input.root_execution_id,
          previous_execution_id: input.previous_execution_id,
          input: input.input,
          trace_id: input.trace_id,
          timeout_at: execution.timeout_at,
        };
        const { data, error } = await sb.rpc("create_execution_transaction", {
          p_task_id: input.task_id,
          p_decision_id: input.decision_id,
          p_execution: retryPayload,
        });
        if (error) throw new ExecutionRepositoryError("internal_error", error.message);
        const res = data as { execution?: { id: string } };
        return { id: res.execution?.id ?? "" };
      },
    });

    if (result.outcome === "succeeded") {
      const response: ExecuteResponse = {
        kind: "ai_success",
        execution_id: result.execution_id,
        verdict: decision.verdict as "ai" | "hybrid",
        status: "succeeded",
        output: result.output,
        tokens: result.tokens,
        ms: result.ms,
      };
      return ok(response);
    }

    if (result.outcome === "failed") {
      const response: ExecuteResponse = {
        kind: "ai_failed",
        execution_id: result.execution_id,
        verdict: decision.verdict as "ai" | "hybrid",
        status: "failed",
        error_code: result.error_code,
        retryable: result.retryable,
        retry_created: result.retry_created,
      };
      return ok(response);
    }

    // invalid_state — should not happen for freshly created execution
    throw new ApiFail("conflict", `Execution in unexpected state: ${result.current_status}`);
  } catch (e) {
    if (e instanceof ApiFail) throw e;
    if (e instanceof ExecutionRepositoryError) throw new ApiFail(e.code, e.message);
    throw new ApiFail("upstream_error", "AI executor is not available");
  }
});
