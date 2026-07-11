// Feature 4.2 — Executor runtime types.

import type { ExecutorType, ExecutionErrorCode } from "@orchestra/contracts";
import type { LanguageModel } from "ai";

// ── Executor output ─────────────────────────────────────────

export interface ExecutorOutput {
  /** Generated text output from the model. */
  output: string;
  /** Total tokens consumed (prompt + completion). Null if provider doesn't report. */
  tokens: number | null;
  /** Cost in USD. Always null in MVP (Qwen doesn't return cost). */
  cost: null;
  /** Wall-clock duration in milliseconds. Always measured. */
  ms: number;
}

// ── Executor options ────────────────────────────────────────

export interface ExecutorOptions {
  /** The language model to use (Qwen via OpenAI-compatible provider). */
  model: LanguageModel;
  /** Timeout in ms for the model call. Default: 30000. */
  timeoutMs?: number;
  /** External abort signal (e.g. from request lifecycle). */
  signal?: AbortSignal;
}

// ── Executor error result ───────────────────────────────────

export interface ExecutorFailure {
  error_code: ExecutionErrorCode;
  error_message: string;
  retryable: boolean;
}

// ── Execute result (discriminated union) ────────────────────

export type ExecuteResult =
  | { ok: true; data: ExecutorOutput }
  | { ok: false; error: ExecutorFailure };

// ── Executor run input ──────────────────────────────────────

export interface ExecutorRunInput {
  /** Which executor to run. */
  type: ExecutorType;
  /** Raw input — will be validated against per-executor schema. */
  input: unknown;
}

// ── Log event (for observability) ───────────────────────────

export type ExecutorLogEvent =
  | { kind: "start"; type: ExecutorType }
  | { kind: "success"; type: ExecutorType; ms: number; tokens: number | null }
  | { kind: "failure"; type: ExecutorType; error_code: ExecutionErrorCode; retryable: boolean };
