// [S] Shared contract — Execution domain (Feature 4.1 + 4.2).
// Owner ghi DB: Founder A. Cross-domain: updates tasks.status via atomic RPC.

import type { Capability } from "./capabilities";
import type { Verdict } from "./decision";

// ── Status enum ─────────────────────────────────────────────
/**
 * Execution lifecycle states.
 * Terminal: succeeded, failed, cancelled.
 * Active (at most 1 per decision): pending, running.
 */
export type ExecutionStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export const TERMINAL_STATUSES: readonly ExecutionStatus[] = [
  "succeeded",
  "failed",
  "cancelled",
] as const;

export const ACTIVE_STATUSES: readonly ExecutionStatus[] = [
  "pending",
  "running",
] as const;

// ── Executor types (5 MVP executors, mục 02/09) ─────────────
export type ExecutorType =
  | "summarize"
  | "research"
  | "email"
  | "translate"
  | "meeting";

export const EXECUTOR_TYPES: readonly ExecutorType[] = [
  "summarize",
  "research",
  "email",
  "translate",
  "meeting",
] as const;

// ── Capability → Executor mapping (Feature 4.2) ────────────
/**
 * Only these 5 capabilities have AI executors.
 * Other capabilities (writing, analysis, coding, design) are human-only.
 * If a decision has multiple supported capabilities, pick highest weight.
 */
export const CAPABILITY_EXECUTOR_MAP: Partial<Record<Capability, ExecutorType>> = {
  summarization: "summarize",
  research: "research",
  email_drafting: "email",
  translation: "translate",
  meeting_notes: "meeting",
} as const;

// ── State machine events ────────────────────────────────────
export type ExecutionEvent =
  | "start"
  | "succeed"
  | "fail"
  | "cancel";

// ── Execution DTO ───────────────────────────────────────────
export interface Execution {
  id: string;
  task_id: string;
  decision_id: string;
  verdict: Verdict;
  executor: ExecutorType | null; // null for human/escalate
  assignee_id: string | null; // agent/human assigned
  reviewer_id: string | null; // human reviewer for hybrid
  status: ExecutionStatus;
  attempt: number; // 1-based
  max_retries: number;
  root_execution_id: string; // first execution in retry chain (self if attempt=1)
  previous_execution_id: string | null; // link to prior failed attempt
  input: unknown; // structured input jsonb
  output: string | null;
  error_code: string | null; // machine-readable error identifier
  error_message: string | null;
  tokens: number | null; // actual tokens, null until done
  cost: number | null; // actual cost, null until done
  ms: number | null; // actual duration ms, null until done
  trace_id: string;
  timeout_at: string | null; // ISO timestamp deadline
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ── Create input ────────────────────────────────────────────
export interface CreateExecutionInput {
  task_id: string;
  decision_id: string;
  verdict: Verdict;
  executor: ExecutorType | null;
  assignee_id: string | null;
  reviewer_id: string | null;
  input: unknown;
  max_retries?: number; // default: 2 for AI, 0 for human
  timeout_ms?: number; // default: 30000 for AI, null for human
}

// ── Retry input (creates new row) ───────────────────────────
export interface RetryExecutionInput {
  failed_execution_id: string;
  root_execution_id: string;
  attempt: number; // previous attempt + 1
}

// ── Result / Error shapes ───────────────────────────────────
export interface ExecutionResult {
  output: string;
  tokens?: number;
  cost?: number;
  ms: number;
}

export type ExecutionErrorCode =
  | "TIMEOUT"
  | "LLM_ERROR"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR";

export interface ExecutionError {
  error_code: ExecutionErrorCode;
  error_message: string;
  retryable: boolean;
}

// ── Transition rule (for documentation / state machine) ─────
export interface TransitionRule {
  from: ExecutionStatus;
  event: ExecutionEvent;
  to: ExecutionStatus;
}

/**
 * Allowed transitions — source of truth for state machine.
 * Retry is NOT a transition on the same row; it creates a new execution row.
 */
export const ALLOWED_TRANSITIONS: readonly TransitionRule[] = [
  { from: "pending", event: "start", to: "running" },
  { from: "pending", event: "cancel", to: "cancelled" },
  { from: "running", event: "succeed", to: "succeeded" },
  { from: "running", event: "fail", to: "failed" },
  { from: "running", event: "cancel", to: "cancelled" },
] as const;

// ── Human submission (Feature 4.3) ─────────────────────────

/**
 * Input for human assignee submitting execution result.
 * submitter_id is NOT in body — resolved from auth session by service layer.
 */
export interface HumanSubmitResultInput {
  execution_id: string;
  output: string;
}

export interface HumanSubmitResult {
  execution_id: string;
  task_id: string;
  status: "succeeded";
  task_status: "done";
}

// ── Hybrid review (Feature 4.3) ─────────────────────────────

export type ReviewOutcome = "approve" | "reject";

/**
 * Input for reviewer approving/rejecting hybrid AI output.
 * reviewer_id is NOT in body — resolved from auth session by service layer.
 */
export interface ReviewInput {
  execution_id: string;
  outcome: ReviewOutcome;
  note?: string;
}

export interface ReviewResult {
  execution_id: string;
  task_id: string;
  outcome: ReviewOutcome;
  task_status: "done" | "rejected";
}

// ── Execute API response (Feature 4.4) ──────────────────────
/**
 * Discriminated union for POST /api/execute response.
 * Each variant has a clear `kind` discriminator.
 */
export type ExecuteResponse =
  | ExecuteAiSuccess
  | ExecuteAiFailed
  | ExecuteHumanPending
  | ExecuteEscalate
  | ExecuteExisting;

export interface ExecuteAiSuccess {
  kind: "ai_success";
  execution_id: string;
  verdict: "ai" | "hybrid";
  status: "succeeded";
  output: string;
  tokens: number | null;
  ms: number;
}

export interface ExecuteAiFailed {
  kind: "ai_failed";
  execution_id: string;
  verdict: "ai" | "hybrid";
  status: "failed";
  error_code: ExecutionErrorCode;
  retryable: boolean;
  retry_created: boolean;
}

export interface ExecuteHumanPending {
  kind: "human_pending";
  execution_id: string;
  verdict: "human";
  status: "pending";
  assignee_id: string;
}

export interface ExecuteEscalate {
  kind: "escalate";
  execution_id: null;
  verdict: "escalate";
  reason: string;
}

export interface ExecuteExisting {
  kind: "existing";
  execution_id: string;
  verdict: Verdict;
  status: ExecutionStatus;
}

