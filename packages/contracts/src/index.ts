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
export type { Verdict, Risk, RequiredCapability, Candidate, Governance, Decision } from "./decision";

// ── Workspace domain (domain B owns) ────────────────────────
export type { TaskStatus, Task, Feedback } from "./task";
export type { AgentType, CapabilityMap, Agent, NewAgentInput, AgentPatch } from "./agent";
export type {
  Verdict,
  Risk,
  RequiredCapability,
  Candidate,
  Governance,
  Decision,
} from "./decision";

export type { PoolCandidate } from "./agent";
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
