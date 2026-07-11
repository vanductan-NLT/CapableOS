// POST /api/tasks/pipeline — Full pipeline: create task → route → execute.
// Owner: B (task creation) + A (routing + execution).
// This is the "production-ready" endpoint: user submits text, gets result back.

import type { DecisionResponse, ExecuteResponse, Task } from "@orchestra/contracts";
import { ApiFail, jsonBody, ok, route } from "../../../../lib/api";
import { createTaskSchema } from "../../../../lib/schemas";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import type { TaskRow } from "../../../../lib/db-types";
import { toTask } from "../../../../lib/row-mappers";
import { createQwenPlannerOptions } from "../../../../lib/decision/planner-options";
import { createProductionRouteDecisionService } from "../../../../lib/decision/production-service";
import { mapDecisionToExecution, ExecutionMapperError } from "../../../../lib/execution/mapper";
import { createExecutionRepository, ExecutionRepositoryError } from "../../../../lib/execution/execution-repository";
import { runExecution, type ExecutionRecord } from "../../../../lib/execution/executor-service";
import { checkGovernance, resolveGovernanceAction, type ExecutorType } from "@orchestra/contracts";

export interface PipelineResponse {
  task: Task;
  decision: DecisionResponse | null;
  execution: ExecuteResponse | null;
  error_stage?: "route" | "execute";
  error_message?: string;
}

export const POST = route(async (req: Request) => {
  const body = await jsonBody(req, createTaskSchema);
  const sb = supabaseAdmin();

  // 1. Create task
  const { data: taskRow, error: createErr } = await sb
    .from("tasks")
    .insert({ title: body.title, description: body.description ?? null })
    .select("*")
    .single();
  if (createErr) throw new ApiFail("internal_error", createErr.message);
  const task = toTask(taskRow as TaskRow);

  // 2. Route task (AI decision)
  let decision: DecisionResponse | null = null;
  try {
    const service = createProductionRouteDecisionService(createQwenPlannerOptions);
    decision = await service.routeTask(task.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Routing failed";
    return ok<PipelineResponse>({
      task,
      decision: null,
      execution: null,
      error_stage: "route",
      error_message: msg,
    }, { status: 201 });
  }

  // 3. Auto-execute for AI/hybrid verdicts
  if (decision.verdict === "ai" || decision.verdict === "hybrid") {
    try {
      // Auto-construct executor input from task data
      const preliminaryMap = mapDecisionToExecution(decision);
      const executorInput = buildExecutorInput(preliminaryMap.executor, body.title, body.description);
      let executionInput = mapDecisionToExecution(decision, { input: executorInput });

      // Governance gate
      const executor = executionInput.executor as ExecutorType;
      const action = resolveGovernanceAction(executor);
      const governance = checkGovernance({ action });

      if (governance.gate === "deny") {
        const response: ExecuteResponse = {
          kind: "denied",
          verdict: decision.verdict,
          execution_id: null,
          reason: governance.reason,
        };
        return ok<PipelineResponse>({ task: { ...task, status: "routed" }, decision, execution: response }, { status: 201 });
      }

      if (governance.gate === "approval" && decision.verdict === "ai") {
        executionInput = { ...executionInput, verdict: "hybrid" as const, reviewer_id: executionInput.assignee_id };
      }

      // Create execution via RPC
      const traceId = crypto.randomUUID();
      const repo = createExecutionRepository(sb as never);
      let rpcResult;
      try {
        rpcResult = await repo.createExecution(decision.task_id, decision.id, executionInput, traceId);
      } catch (e) {
        if (e instanceof ExecutionRepositoryError) {
          return ok<PipelineResponse>({
            task: { ...task, status: "routed" },
            decision,
            execution: null,
            error_stage: "execute",
            error_message: e.message,
          }, { status: 201 });
        }
        throw e;
      }

      if (rpcResult.status === "not_found" || rpcResult.status === "conflict" || rpcResult.status === "invalid_verdict") {
        return ok<PipelineResponse>({
          task: { ...task, status: "routed" },
          decision,
          execution: null,
          error_stage: "execute",
          error_message: `RPC: ${rpcResult.status}`,
        }, { status: 201 });
      }

      if (rpcResult.status === "existing") {
        const response: ExecuteResponse = {
          kind: "existing",
          execution_id: rpcResult.execution.id,
          verdict: rpcResult.execution.verdict!,
          status: rpcResult.execution.status,
        };
        return ok<PipelineResponse>({ task: { ...task, status: "executing" }, decision, execution: response }, { status: 201 });
      }

      const execution = rpcResult.execution;

      // Run the AI executor
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
            verdict: executionInput.verdict ?? decision!.verdict,
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
          verdict: (executionInput.verdict ?? decision.verdict) as "ai" | "hybrid",
          status: "succeeded",
          output: result.output,
          tokens: result.tokens,
          ms: result.ms,
        };
        return ok<PipelineResponse>({ task: { ...task, status: "done" }, decision, execution: response }, { status: 201 });
      }

      if (result.outcome === "failed") {
        const response: ExecuteResponse = {
          kind: "ai_failed",
          execution_id: result.execution_id,
          verdict: (executionInput.verdict ?? decision.verdict) as "ai" | "hybrid",
          status: "failed",
          error_code: result.error_code,
          retryable: result.retryable,
          retry_created: result.retry_created,
        };
        return ok<PipelineResponse>({ task: { ...task, status: "executing" }, decision, execution: response }, { status: 201 });
      }

      // invalid_state
      return ok<PipelineResponse>({
        task: { ...task, status: "routed" },
        decision,
        execution: null,
        error_stage: "execute",
        error_message: "Execution in unexpected state",
      }, { status: 201 });
    } catch (e) {
      if (e instanceof ExecutionMapperError) {
        return ok<PipelineResponse>({
          task: { ...task, status: "routed" },
          decision,
          execution: null,
          error_stage: "execute",
          error_message: e.message,
        }, { status: 201 });
      }
      const msg = e instanceof Error ? e.message : "Execution failed";
      return ok<PipelineResponse>({
        task: { ...task, status: "routed" },
        decision,
        execution: null,
        error_stage: "execute",
        error_message: msg,
      }, { status: 201 });
    }
  }

  // 4. For human/escalate — no auto-execution
  if (decision.verdict === "human") {
    return ok<PipelineResponse>({
      task: { ...task, status: "routed" },
      decision,
      execution: null,
    }, { status: 201 });
  }

  // Escalate
  return ok<PipelineResponse>({
    task: { ...task, status: "routed" },
    decision,
    execution: null,
  }, { status: 201 });
});

// ── Helper: build structured executor input from task data ──

function buildExecutorInput(
  executor: ExecutorType | null,
  title: string,
  description?: string,
): Record<string, unknown> {
  const base = { task_title: title, task_description: description ?? "" };
  const content = description || title;

  switch (executor) {
    case "summarize":
      return { ...base, content };
    case "research":
      return { ...base, query: title, context: description };
    case "email":
      return { ...base, intent: title, recipient: "", tone: "formal" as const };
    case "translate":
      return { ...base, content, target_language: "Vietnamese" };
    case "meeting":
      return { ...base, transcript: content };
    default:
      // Fallback: pass base fields + content for any executor
      return { ...base, content };
  }
}
