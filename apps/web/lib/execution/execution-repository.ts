// Feature 4.4 — Execution repository: DB access for execution endpoints.
// Uses supabaseAdmin (service_role) for RPC calls and reads.

import type { ApiErrorCode, CreateExecutionInput, DecisionResponse, ExecutionStatus, Verdict } from "@orchestra/contracts";
import type { ExecutionRow } from "@/lib/db-types";

// ── Types ───────────────────────────────────────────────────

export interface ExecutionRepositoryClient {
  rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
  from(table: "executions"): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
  from(table: "decisions"): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
}

// ── Errors ──────────────────────────────────────────────────

export class ExecutionRepositoryError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ExecutionRepositoryError";
  }
}

// ── Create execution RPC result ─────────────────────────────

export type CreateExecutionRpcResult =
  | { status: "created"; execution: ExecutionRow }
  | { status: "existing"; execution: ExecutionRow }
  | { status: "not_found" }
  | { status: "conflict"; task_status: string }
  | { status: "invalid_verdict"; verdict: string };

// ── Repository ──────────────────────────────────────────────

export function createExecutionRepository(client: ExecutionRepositoryClient) {
  return {
    getExecutionById(id: string) {
      return getExecutionById(client, id);
    },
    getDecisionById(id: string) {
      return getDecisionById(client, id);
    },
    createExecution(taskId: string, decisionId: string, input: CreateExecutionInput, traceId: string) {
      return createExecution(client, taskId, decisionId, input, traceId);
    },
  };
}

// ── Load execution ──────────────────────────────────────────

async function getExecutionById(
  client: ExecutionRepositoryClient,
  id: string,
): Promise<ExecutionRow | null> {
  const { data, error } = await client
    .from("executions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ExecutionRepositoryError("internal_error", error.message);
  }

  return data as ExecutionRow | null;
}

// ── Load decision ───────────────────────────────────────────

async function getDecisionById(
  client: ExecutionRepositoryClient,
  id: string,
): Promise<DecisionResponse | null> {
  const { data, error } = await client
    .from("decisions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ExecutionRepositoryError("internal_error", error.message);
  }

  return data as DecisionResponse | null;
}

// ── Create execution via RPC ────────────────────────────────

async function createExecution(
  client: ExecutionRepositoryClient,
  taskId: string,
  decisionId: string,
  input: CreateExecutionInput,
  traceId: string,
): Promise<CreateExecutionRpcResult> {
  const payload = {
    verdict: input.verdict,
    executor: input.executor,
    assignee_id: input.assignee_id,
    reviewer_id: input.reviewer_id,
    attempt: 1,
    max_retries: input.max_retries ?? 0,
    root_execution_id: null,
    previous_execution_id: null,
    input: input.input,
    trace_id: traceId,
    timeout_at: input.timeout_ms
      ? new Date(Date.now() + input.timeout_ms).toISOString()
      : null,
  };

  const { data, error } = await client.rpc("create_execution_transaction", {
    p_task_id: taskId,
    p_decision_id: decisionId,
    p_execution: payload,
  });

  if (error) {
    throw new ExecutionRepositoryError("internal_error", error.message);
  }

  const result = data as { status: string; execution?: unknown; task_status?: string; verdict?: string };

  switch (result.status) {
    case "created":
      return { status: "created", execution: result.execution as ExecutionRow };
    case "existing":
      return { status: "existing", execution: result.execution as ExecutionRow };
    case "not_found":
      return { status: "not_found" };
    case "conflict":
      return { status: "conflict", task_status: result.task_status as string };
    case "invalid_verdict":
      return { status: "invalid_verdict", verdict: result.verdict as string };
    default:
      throw new ExecutionRepositoryError("internal_error", `Unexpected RPC status: ${result.status}`);
  }
}

// ── Ownership check ─────────────────────────────────────────

/**
 * Checks if a user has access to view an execution.
 * MVP rule: user must be assignee or reviewer. Anonymous bypasses for demo.
 */
export function canViewExecution(execution: ExecutionRow, userId: string): boolean {
  if (userId === "anonymous") return true;
  return execution.assignee_id === userId || execution.reviewer_id === userId;
}
