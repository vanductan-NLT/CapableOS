// Feature 4.3 — Human + Hybrid execution service.
// Provides submitHumanResult and reviewHybridExecution.
// Ownership is verified by RPC (assignee_id / reviewer_id check in DB).
// User ID comes from auth session, NOT from request body.

import type {
  ApiErrorCode,
  HumanSubmitResult,
  ReviewOutcome,
  ReviewResult,
} from "@orchestra/contracts";

// ── Types ───────────────────────────────────────────────────

export interface HumanServiceDeps {
  /** Calls submit_human_result RPC. */
  submitHumanResultRpc(
    executionId: string,
    submitterId: string,
    output: string,
  ): Promise<SubmitRpcResult>;

  /** Calls review_hybrid_execution RPC. */
  reviewHybridExecutionRpc(
    executionId: string,
    reviewerId: string,
    outcome: ReviewOutcome,
    note: string | null,
  ): Promise<ReviewRpcResult>;
}

// ── RPC result shapes ───────────────────────────────────────

export type SubmitRpcResult =
  | { status: "submitted"; execution: { id: string; task_id: string } }
  | { status: "already_submitted"; execution: { id: string; task_id: string } }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "conflict"; current_status?: string }
  | { status: "invalid_verdict"; verdict: string };

export type ReviewRpcResult =
  | { status: "reviewed"; execution: { id: string; task_id: string }; task_status: string }
  | { status: "already_reviewed"; execution: { id: string; task_id: string } }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "conflict"; reason?: string; current_status?: string; task_status?: string }
  | { status: "invalid_verdict"; verdict: string }
  | { status: "invalid_outcome"; outcome: string };

// ── Service errors ──────────────────────────────────────────

export class HumanServiceError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "HumanServiceError";
  }
}

// ── Service functions ───────────────────────────────────────

/**
 * Submit human execution result.
 * Called by the assigned human (submitterId from auth session).
 */
export async function submitHumanResult(
  executionId: string,
  submitterId: string,
  output: string,
  deps: HumanServiceDeps,
): Promise<HumanSubmitResult> {
  const result = await deps.submitHumanResultRpc(executionId, submitterId, output);

  switch (result.status) {
    case "submitted":
    case "already_submitted":
      return {
        execution_id: result.execution.id,
        task_id: result.execution.task_id,
        status: "succeeded",
        task_status: "done",
      };

    case "not_found":
      throw new HumanServiceError("not_found", `Execution ${executionId} not found`);

    case "forbidden":
      throw new HumanServiceError("forbidden", "You are not the assigned executor for this task");

    case "conflict":
      throw new HumanServiceError(
        "conflict",
        result.current_status
          ? `Execution cannot be submitted from status "${result.current_status}"`
          : "Execution has already been submitted with different output",
      );

    case "invalid_verdict":
      throw new HumanServiceError(
        "conflict",
        `Cannot submit human result: execution verdict is "${result.verdict}", expected "human"`,
      );
  }
}

/**
 * Review hybrid execution (approve or reject AI output).
 * Called by the assigned reviewer (reviewerId from auth session).
 */
export async function reviewHybridExecution(
  executionId: string,
  reviewerId: string,
  outcome: ReviewOutcome,
  note: string | null,
  deps: HumanServiceDeps,
): Promise<ReviewResult> {
  const result = await deps.reviewHybridExecutionRpc(executionId, reviewerId, outcome, note);

  switch (result.status) {
    case "reviewed":
      return {
        execution_id: result.execution.id,
        task_id: result.execution.task_id,
        outcome,
        task_status: result.task_status as "done" | "rejected",
      };

    case "already_reviewed":
      return {
        execution_id: result.execution.id,
        task_id: result.execution.task_id,
        outcome,
        task_status: outcome === "approve" ? "done" : "rejected",
      };

    case "not_found":
      throw new HumanServiceError("not_found", `Execution ${executionId} not found`);

    case "forbidden":
      throw new HumanServiceError("forbidden", "You are not the assigned reviewer for this execution");

    case "conflict":
      if (result.reason === "outcome_mismatch") {
        throw new HumanServiceError("conflict", "Execution has already been reviewed with a different outcome");
      }
      if (result.reason === "execution_not_succeeded") {
        throw new HumanServiceError(
          "conflict",
          `Cannot review: AI execution has not succeeded yet (status: "${result.current_status}")`,
        );
      }
      if (result.reason === "task_not_awaiting_approval") {
        throw new HumanServiceError(
          "conflict",
          `Cannot review: task is not awaiting approval (status: "${result.task_status}")`,
        );
      }
      throw new HumanServiceError("conflict", "Review cannot be performed in current state");

    case "invalid_verdict":
      throw new HumanServiceError(
        "conflict",
        `Cannot review: execution verdict is "${result.verdict}", expected "hybrid"`,
      );

    case "invalid_outcome":
      throw new HumanServiceError(
        "validation_error",
        `Invalid review outcome: "${result.outcome}"`,
      );
  }
}
