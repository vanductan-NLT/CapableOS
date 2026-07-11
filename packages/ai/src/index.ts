export { CapabilityNormalizationError, normalizeCapabilities } from "./capability";
export { plan } from "./planner";
export type { PlanInput, PlanOptions, PlanResult } from "./planner";
export {
  DEFAULT_SCORING_WEIGHTS,
  SCORE_EPSILON,
  ScoringError,
  scoreCandidates,
} from "./scoring";
export type {
  ScoredCandidate,
  ScoreCandidatesInput,
  ScoringFailureReason,
  ScoringResult,
  ScoringWeights,
} from "./scoring";
export { DEFAULT_ROUTER_CONFIG, ROUTER_EPSILON, RouterError, routeDecision } from "./router";
export type {
  RouteDecisionInput,
  RouteDecisionResult,
  RouterConfig,
  RouterReasonCode,
} from "./router";
export { decideTask } from "./decision-pipeline";
export type { DecideTaskInput, DecideTaskResult } from "./decision-pipeline";

// ── Executor runtime (Feature 4.2) ─────────────────────────
export {
  executeTask,
  classifyError,
  validationFailure,
  validateExecutorInput,
  safeValidateExecutorInput,
  baseExecutorInputSchema,
  summarizeInputSchema,
  researchInputSchema,
  emailInputSchema,
  translateInputSchema,
  meetingInputSchema,
} from "./executor";
export type {
  BaseExecutorInput,
  SummarizeInput,
  ResearchInput,
  EmailInput,
  TranslateInput,
  MeetingInput,
  ExecutorOutput,
  ExecutorOptions,
  ExecutorFailure,
  ExecuteResult,
  ExecutorRunInput,
  ExecutorLogEvent,
} from "./executor";
