// Feature 4.2 — Core executor runtime.
// Calls generateText with per-executor prompt, validates input, measures wall-clock ms,
// extracts tokens from provider response.

import type { ExecutorType } from "@orchestra/contracts";
import {
  EXECUTOR_EMAIL_PROMPT,
  EXECUTOR_MEETING_PROMPT,
  EXECUTOR_RESEARCH_PROMPT,
  EXECUTOR_SUMMARIZE_PROMPT,
  EXECUTOR_TRANSLATE_PROMPT,
} from "@orchestra/prompts";
import { generateText } from "ai";
import { classifyError, validationFailure } from "./errors";
import { safeValidateExecutorInput } from "./schemas";
import type { ExecuteResult, ExecutorOptions, ExecutorRunInput } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;
const TEMPERATURE = 0.3;

// ── Prompt registry ─────────────────────────────────────────

const EXECUTOR_PROMPTS: Record<ExecutorType, string> = {
  summarize: EXECUTOR_SUMMARIZE_PROMPT,
  research: EXECUTOR_RESEARCH_PROMPT,
  email: EXECUTOR_EMAIL_PROMPT,
  translate: EXECUTOR_TRANSLATE_PROMPT,
  meeting: EXECUTOR_MEETING_PROMPT,
};

// ── Public API ──────────────────────────────────────────────

/**
 * Executes a single AI task using the specified executor type.
 *
 * Flow:
 * 1. Validate input against per-executor schema.
 * 2. Build user prompt from validated input.
 * 3. Call generateText with system prompt + timeout.
 * 4. Extract output text + token usage.
 * 5. Validate output is non-empty.
 * 6. Return ExecuteResult (ok or error).
 *
 * Never throws — all errors are caught and returned as ExecuteResult.ok=false.
 */
export async function executeTask(
  runInput: ExecutorRunInput,
  options: ExecutorOptions,
): Promise<ExecuteResult> {
  // Step 1: Validate input
  const validation = safeValidateExecutorInput(runInput.type, runInput.input);
  if (!validation.success) {
    return {
      ok: false,
      error: validationFailure(
        `Input validation failed: ${validation.error.issues[0]?.message ?? "invalid input"}`,
      ),
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const systemPrompt = EXECUTOR_PROMPTS[runInput.type];
  const userPrompt = buildUserPrompt(validation.data);

  // Step 2-3: Call model with timeout
  const startMs = Date.now();

  try {
    const abortController = new AbortController();

    // Combine external signal with timeout signal
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
    if (options.signal) {
      options.signal.addEventListener("abort", () => abortController.abort(), { once: true });
    }

    let result;
    try {
      result = await generateText({
        model: options.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: TEMPERATURE,
        abortSignal: abortController.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const ms = Date.now() - startMs;

    // Step 4: Extract tokens
    const tokens = result.usage?.totalTokens ?? null;

    // Step 5: Validate output is non-empty
    const output = result.text?.trim();
    if (!output) {
      return {
        ok: false,
        error: validationFailure("Model returned empty output"),
      };
    }

    // Step 6: Success
    return {
      ok: true,
      data: {
        output,
        tokens,
        cost: null, // Qwen API does not return cost
        ms,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: classifyError(error),
    };
  }
}

// ── Internal ────────────────────────────────────────────────

function buildUserPrompt(validatedInput: unknown): string {
  return JSON.stringify(validatedInput, null, 2);
}
