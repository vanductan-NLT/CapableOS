// Feature 4.2 — Executor error classification.
// Classifies raw errors into ExecutorFailure with retryable semantics.
// Raw provider messages are NOT exposed in user-facing error_message.

import type { ExecutionErrorCode } from "@orchestra/contracts";
import type { ExecutorFailure } from "./types";

// ── Stable user-facing messages (no raw provider details) ───

const STABLE_MESSAGES: Record<ExecutionErrorCode, string> = {
  TIMEOUT: "Execution timed out",
  LLM_ERROR: "AI provider encountered an error",
  VALIDATION_ERROR: "Executor output validation failed",
  NETWORK_ERROR: "Network connection to AI provider failed",
};

// ── Classification logic ────────────────────────────────────

/**
 * Classifies an unknown error into a structured ExecutorFailure.
 * Rules:
 * - AbortError / TimeoutError → TIMEOUT, retryable
 * - Network errors (fetch failed, ECONNREFUSED, etc.) → NETWORK_ERROR, retryable
 * - Provider 5xx / rate limit → LLM_ERROR, retryable
 * - Empty/invalid output → VALIDATION_ERROR, not retryable
 * - Unknown → LLM_ERROR, retryable (assume transient)
 */
export function classifyError(error: unknown): ExecutorFailure {
  if (isAbortError(error)) {
    return failure("TIMEOUT", true);
  }

  if (isNetworkError(error)) {
    return failure("NETWORK_ERROR", true);
  }

  if (isRateLimitOrServerError(error)) {
    return failure("LLM_ERROR", true);
  }

  // Default: assume transient LLM error
  return failure("LLM_ERROR", true);
}

/**
 * Creates a VALIDATION_ERROR failure (not retryable).
 * Used when output is empty or doesn't meet expectations.
 */
export function validationFailure(detail?: string): ExecutorFailure {
  return {
    error_code: "VALIDATION_ERROR",
    error_message: detail ?? STABLE_MESSAGES.VALIDATION_ERROR,
    retryable: false,
  };
}

// ── Internal helpers ────────────────────────────────────────

function failure(code: ExecutionErrorCode, retryable: boolean): ExecutorFailure {
  return {
    error_code: code,
    error_message: STABLE_MESSAGES[code],
    retryable,
  };
}

function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    // AbortError from AbortSignal.timeout()
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return true;
    }
    // AI SDK wraps abort as "AbortError" or includes "aborted" in message
    if (/abort/i.test(error.message) || /timeout/i.test(error.name)) {
      return true;
    }
  }
  return false;
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message.toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("network") ||
    msg.includes("dns") ||
    msg.includes("socket")
  );
}

function isRateLimitOrServerError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message.toLowerCase();
  // AI SDK typically includes status code in error message
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("internal server error") ||
    msg.includes("service unavailable")
  );
}
