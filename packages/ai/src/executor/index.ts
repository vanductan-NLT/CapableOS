// Feature 4.2 — Executor module barrel export.

export { executeTask } from "./execute";
export { classifyError, validationFailure } from "./errors";
export {
  validateExecutorInput,
  safeValidateExecutorInput,
  baseExecutorInputSchema,
  summarizeInputSchema,
  researchInputSchema,
  emailInputSchema,
  translateInputSchema,
  meetingInputSchema,
} from "./schemas";
export type {
  BaseExecutorInput,
  SummarizeInput,
  ResearchInput,
  EmailInput,
  TranslateInput,
  MeetingInput,
} from "./schemas";
export type {
  ExecutorOutput,
  ExecutorOptions,
  ExecutorFailure,
  ExecuteResult,
  ExecutorRunInput,
  ExecutorLogEvent,
} from "./types";
