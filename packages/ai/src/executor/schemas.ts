// Feature 4.2 — Per-executor input schemas.
// Each executor validates its required fields before calling the model.

import { z } from "zod";
import type { ExecutorType } from "@orchestra/contracts";

// ── Base input (shared across all executors) ────────────────

export const baseExecutorInputSchema = z.object({
  task_title: z.string().min(1, "task_title is required"),
  task_description: z.string().optional(),
});

export type BaseExecutorInput = z.infer<typeof baseExecutorInputSchema>;

// ── Summarize ───────────────────────────────────────────────

export const summarizeInputSchema = baseExecutorInputSchema.extend({
  /** The text content to summarize. */
  content: z.string().min(1, "content is required for summarization"),
  /** Optional max length hint for summary. */
  max_length: z.number().int().positive().optional(),
});

export type SummarizeInput = z.infer<typeof summarizeInputSchema>;

// ── Research ────────────────────────────────────────────────

export const researchInputSchema = baseExecutorInputSchema.extend({
  /** The topic or question to research. */
  query: z.string().min(1, "query is required for research"),
  /** Optional context documents to base research on (no web search). */
  context: z.string().optional(),
});

export type ResearchInput = z.infer<typeof researchInputSchema>;

// ── Email ───────────────────────────────────────────────────

export const emailInputSchema = baseExecutorInputSchema.extend({
  /** The intent/purpose of the email. */
  intent: z.string().min(1, "intent is required for email drafting"),
  /** Recipient context (who is the email for). */
  recipient: z.string().optional(),
  /** Tone: formal, casual, etc. */
  tone: z.enum(["formal", "casual", "neutral"]).default("neutral"),
});

export type EmailInput = z.infer<typeof emailInputSchema>;

// ── Translate ───────────────────────────────────────────────

export const translateInputSchema = baseExecutorInputSchema.extend({
  /** The text to translate. */
  content: z.string().min(1, "content is required for translation"),
  /** Target language. Defaults to Vietnamese if not specified. */
  target_language: z.string().default("Vietnamese"),
  /** Source language hint (optional, auto-detect if omitted). */
  source_language: z.string().optional(),
});

export type TranslateInput = z.infer<typeof translateInputSchema>;

// ── Meeting ─────────────────────────────────────────────────

export const meetingInputSchema = baseExecutorInputSchema.extend({
  /** The meeting transcript or notes to summarize. */
  transcript: z.string().min(1, "transcript is required for meeting summary"),
  /** Optional list of participants. */
  participants: z.array(z.string()).optional(),
});

export type MeetingInput = z.infer<typeof meetingInputSchema>;

// ── Schema registry ─────────────────────────────────────────

const EXECUTOR_SCHEMAS: Record<ExecutorType, z.ZodType> = {
  summarize: summarizeInputSchema,
  research: researchInputSchema,
  email: emailInputSchema,
  translate: translateInputSchema,
  meeting: meetingInputSchema,
};

/**
 * Validates executor input against the schema for the given executor type.
 * Throws ZodError if validation fails.
 */
export function validateExecutorInput(type: ExecutorType, input: unknown): unknown {
  const schema = EXECUTOR_SCHEMAS[type];
  return schema.parse(input);
}

/**
 * Safe version — returns result instead of throwing.
 */
export function safeValidateExecutorInput(
  type: ExecutorType,
  input: unknown,
): { success: true; data: unknown } | { success: false; error: z.ZodError } {
  const schema = EXECUTOR_SCHEMAS[type];
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
