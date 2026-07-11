// Barrel export của @orchestra/contracts — nguồn sự thật của mọi interface.
// Cả domain A (packages/ai) và domain B (features/task, features/dashboard) import TỪ ĐÂY.

// ── Capability taxonomy (Feature 0, domain A owns) ──────────
export {
  CAPABILITIES,
  CapabilitySchema,
  isCapability,
  assertValidCapability,
  assertValidCapabilities,
} from "./capabilities";
export type { Capability } from "./capabilities";

// ── Decision domain (domain A owns) ─────────────────────────
export type {
  Verdict,
  Risk,
  RequiredCapability,
  Candidate,
  ScoredCandidate,
  RouterReasonCode,
  Governance,
  Decision,
  StructuredDecisionReason,
  DecisionPersistenceInput,
  DecisionResponse,
} from "./decision";

// ── Execution domain (Feature 4.1, domain A owns) ───────────
export {
  TERMINAL_STATUSES,
  ACTIVE_STATUSES,
  EXECUTOR_TYPES,
  CAPABILITY_EXECUTOR_MAP,
  ALLOWED_TRANSITIONS,
} from "./execution";
export type {
  ExecutionStatus,
  ExecutorType,
  ExecutionEvent,
  Execution,
  CreateExecutionInput,
  RetryExecutionInput,
  ExecutionResult,
  ExecutionErrorCode,
  ExecutionError,
  TransitionRule,
  HumanSubmitResultInput,
  HumanSubmitResult,
  ReviewOutcome,
  ReviewInput,
  ReviewResult,
  ExecuteResponse,
  ExecuteAiSuccess,
  ExecuteAiFailed,
  ExecuteHumanPending,
  ExecuteEscalate,
  ExecuteExisting,
} from "./execution";

// ── Workspace domain (domain B owns) ────────────────────────
export type { TaskStatus, Task, Feedback } from "./task";
export type { AgentType, CapabilityMap, Agent, NewAgentInput, AgentPatch, PoolCandidate } from "./agent";
export type {
  ApiErrorCode,
  ApiError,
  ApiResponse,
  CreateTaskBody,
  ListTasksQuery,
  PatchTaskBody,
  FeedbackBody,
  FeedbackResult,
  AllocationSplit,
  Metrics,
  CapabilitiesResult,
  CreateAgentBody,
  PatchAgentBody,
  RouteBody,
  RouteResult,
} from "./api";
