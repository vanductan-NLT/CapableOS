// Feature 4.2 — Executor service: orchestrates pending → running → succeeded/failed.
// Runs 1 attempt per call. If retryable + attempts remaining, creates a new retry row.
// Does NOT sleep/retry within the same call — queue/worker retry is a future feature.

import type { ExecutorType, ExecutionErrorCode } from "@orchestra/contracts";
import { executeTask, type ExecuteResult, type ExecutorOptions, type ExecutorRunInput } from "@orchestra/ai";
import type { LanguageModel } from "ai";

// ── Types ───────────────────────────────────────────────────

export interface ExecutionRecord {
  id: string;
  task_id: string;
  decision_id: string;
  executor: ExecutorType;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  attempt: number;
  max_retries: number;
  root_execution_id: string;
  input: unknown;
  trace_id: string;
  timeout_at: string | null;
}

export interface TransitionPayload {
  output?: string;
  tokens?: number;
  cost?: number;
  ms?: number;
  error_code?: string;
  error_message?: string;
}

export interface RetryRowInput {
  task_id: string;
  decision_id: string;
  executor: ExecutorType;
  input: unknown;
  attempt: number;
  max_retries: number;
  root_execution_id: string;
  previous_execution_id: string;
  trace_id: string;
}

// ── Service result ──────────────────────────────────────────

export type RunExecutionResult =
  | { outcome: "succeeded"; execution_id: string; output: string; tokens: number | null; ms: number }
  | { outcome: "failed"; execution_id: string; error_code: ExecutionErrorCode; retryable: boolean; retry_created: boolean }
  | { outcome: "invalid_state"; execution_id: string; current_status: string };

// ── Dependencies (injected for testability) ─────────────────

export interface ExecutorServiceDeps {
  /** Transition execution status via RPC. */
  transitionExecution(id: string, event: string, payload: TransitionPayload): Promise<TransitionResult>;
  /** Create a new retry execution row. */
  createRetryExecution(input: RetryRowInput): Promise<{ id: string }>;
  /** Log for observability. */
  log?(event: ExecutorServiceLogEvent): void;
}

export type TransitionResult =
  | { status: "transitioned"; task_status_update: string }
  | { status: "not_found" }
  | { status: "invalid_transition"; current_status: string; event: string };

export type ExecutorServiceLogEvent =
  | { kind: "execution_start"; execution_id: string; executor: ExecutorType; attempt: number }
  | { kind: "execution_success"; execution_id: string; ms: number; tokens: number | null }
  | { kind: "execution_failure"; execution_id: string; error_code: ExecutionErrorCode; retryable: boolean }
  | { kind: "retry_created"; execution_id: string; new_execution_id: string; attempt: number };

// ── Service ─────────────────────────────────────────────────

/**
 * Runs a single execution attempt.
 *
 * Flow:
 * 1. Validate execution is in "pending" state.
 * 2. Transition pending → running.
 * 3. Call executeTask (AI runtime).
 * 4. On success: transition running → succeeded with output/tokens/ms.
 * 5. On failure: transition running → failed with error_code/message.
 * 6. If retryable + attempt < max_retries: create new retry row (pending).
 * 7. Return structured result. Does NOT run the retry — caller/worker handles that.
 */
export async function runExecution(
  execution: ExecutionRecord,
  model: LanguageModel,
  deps: ExecutorServiceDeps,
): Promise<RunExecutionResult> {
  // Guard: only run pending executions
  if (execution.status !== "pending") {
    return {
      outcome: "invalid_state",
      execution_id: execution.id,
      current_status: execution.status,
    };
  }

  // Step 1: Transition pending → running
  const startResult = await deps.transitionExecution(execution.id, "start", {});
  if (startResult.status !== "transitioned") {
    return {
      outcome: "invalid_state",
      execution_id: execution.id,
      current_status: startResult.status === "invalid_transition" ? startResult.current_status : "not_found",
    };
  }

  deps.log?.({
    kind: "execution_start",
    execution_id: execution.id,
    executor: execution.executor,
    attempt: execution.attempt,
  });

  // Step 2: Run AI executor
  const runInput: ExecutorRunInput = {
    type: execution.executor,
    input: execution.input,
  };

  const executorOptions: ExecutorOptions = {
    model,
    timeoutMs: computeTimeoutMs(execution.timeout_at),
  };

  const result: ExecuteResult = await executeTask(runInput, executorOptions);

  // Step 3: Handle result
  if (result.ok) {
    // Transition running → succeeded
    await deps.transitionExecution(execution.id, "succeed", {
      output: result.data.output,
      tokens: result.data.tokens ?? undefined,
      cost: undefined, // always null in MVP
      ms: result.data.ms,
    });

    deps.log?.({
      kind: "execution_success",
      execution_id: execution.id,
      ms: result.data.ms,
      tokens: result.data.tokens,
    });

    return {
      outcome: "succeeded",
      execution_id: execution.id,
      output: result.data.output,
      tokens: result.data.tokens,
      ms: result.data.ms,
    };
  }

  // Failure path
  const { error } = result;

  // Transition running → failed
  await deps.transitionExecution(execution.id, "fail", {
    error_code: error.error_code,
    error_message: error.error_message,
  });

  deps.log?.({
    kind: "execution_failure",
    execution_id: execution.id,
    error_code: error.error_code,
    retryable: error.retryable,
  });

  // Step 4: Create retry row if eligible
  let retry_created = false;

  if (error.retryable && execution.attempt < execution.max_retries) {
    const retryRow = await deps.createRetryExecution({
      task_id: execution.task_id,
      decision_id: execution.decision_id,
      executor: execution.executor,
      input: execution.input,
      attempt: execution.attempt + 1,
      max_retries: execution.max_retries,
      root_execution_id: execution.root_execution_id,
      previous_execution_id: execution.id,
      trace_id: execution.trace_id,
    });

    retry_created = true;

    deps.log?.({
      kind: "retry_created",
      execution_id: execution.id,
      new_execution_id: retryRow.id,
      attempt: execution.attempt + 1,
    });
  }

  return {
    outcome: "failed",
    execution_id: execution.id,
    error_code: error.error_code,
    retryable: error.retryable,
    retry_created,
  };
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Computes timeout in ms from timeout_at deadline.
 * If no deadline, uses default 30s.
 * If deadline is in the past, uses a minimal 1s (will likely timeout immediately).
 */
function computeTimeoutMs(timeout_at: string | null): number {
  const DEFAULT_TIMEOUT = 30_000;
  const MIN_TIMEOUT = 1_000;

  if (!timeout_at) {
    return DEFAULT_TIMEOUT;
  }

  const deadline = new Date(timeout_at).getTime();
  const remaining = deadline - Date.now();

  if (remaining <= 0) {
    return MIN_TIMEOUT;
  }

  return Math.min(remaining, DEFAULT_TIMEOUT);
}
