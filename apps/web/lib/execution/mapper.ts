// Feature 4.1 + 4.2 — Maps Decision output → CreateExecutionInput.
// Feature 4.2: resolves executor from CAPABILITY_EXECUTOR_MAP (highest-weight supported cap).

import {
  CAPABILITY_EXECUTOR_MAP,
  type CreateExecutionInput,
  type DecisionResponse,
  type ExecutorType,
  type RequiredCapability,
  type Verdict,
} from "@orchestra/contracts";

// ── Default configuration ───────────────────────────────────

const AI_DEFAULT_MAX_RETRIES = 2;
const HUMAN_DEFAULT_MAX_RETRIES = 0;
const AI_DEFAULT_TIMEOUT_MS = 30_000;

// ── Errors ──────────────────────────────────────────────────

export class ExecutionMapperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionMapperError";
  }
}

// ── Public API ──────────────────────────────────────────────

export interface MapDecisionToExecutionOptions {
  /**
   * Optional explicit executor override.
   * If not provided, mapper resolves executor from decision.required capabilities
   * using CAPABILITY_EXECUTOR_MAP (highest weight supported cap wins).
   */
  executor?: ExecutorType;
  /** Override default timeout. */
  timeout_ms?: number;
  /** Structured input for the executor. */
  input?: unknown;
}

/**
 * Maps a completed Decision to a CreateExecutionInput.
 *
 * Rules:
 * - `escalate` verdict → throws (no execution should be created).
 * - `ai` / `hybrid` → requires executor (provided or auto-resolved from capabilities).
 * - `human` → executor is null.
 * - `hybrid` → assignee_id = AI (chosen[0]), reviewer_id = human (chosen[1]).
 */
export function mapDecisionToExecution(
  decision: DecisionResponse,
  options: MapDecisionToExecutionOptions = {},
): CreateExecutionInput {
  assertNotEscalate(decision.verdict);

  const { assignee_id, reviewer_id } = resolveAssignment(decision);
  const executor = resolveExecutor(decision.verdict, decision.required, options.executor);
  const max_retries = resolveMaxRetries(decision.verdict);
  const timeout_ms = resolveTimeout(decision.verdict, options.timeout_ms);

  return {
    task_id: decision.task_id,
    decision_id: decision.id,
    verdict: decision.verdict,
    executor,
    assignee_id,
    reviewer_id,
    input: options.input ?? null,
    max_retries,
    timeout_ms,
  };
}

// ── Internal helpers ────────────────────────────────────────

function assertNotEscalate(verdict: Verdict): asserts verdict is Exclude<Verdict, "escalate"> {
  if (verdict === "escalate") {
    throw new ExecutionMapperError(
      "Cannot create execution for verdict \"escalate\". Escalated decisions require manager review.",
    );
  }
}

function resolveAssignment(decision: DecisionResponse): {
  assignee_id: string | null;
  reviewer_id: string | null;
} {
  const chosen = decision.chosen;

  switch (decision.verdict) {
    case "ai":
      return {
        assignee_id: chosen[0] ?? null,
        reviewer_id: null,
      };
    case "human":
      return {
        assignee_id: chosen[0] ?? null,
        reviewer_id: null,
      };
    case "hybrid":
      // chosen[0] = AI executor, chosen[1] = human reviewer
      if (chosen.length < 2) {
        throw new ExecutionMapperError(
          "Hybrid verdict requires at least 2 chosen candidates (AI + reviewer)",
        );
      }
      return {
        assignee_id: chosen[0]!,
        reviewer_id: chosen[1]!,
      };
    case "escalate":
      return { assignee_id: null, reviewer_id: null };
  }
}

/**
 * Resolves executor for AI/hybrid verdicts.
 * Priority: explicit override > auto-resolve from highest-weight supported capability.
 * Throws if no supported capability found (configuration error, not business escalate).
 */
function resolveExecutor(
  verdict: Exclude<Verdict, "escalate">,
  required: RequiredCapability[],
  explicit?: ExecutorType,
): ExecutorType | null {
  if (verdict === "human") {
    return null;
  }

  // AI or hybrid — explicit override wins
  if (explicit !== undefined) {
    return explicit;
  }

  // Auto-resolve: pick highest-weight capability that has an executor
  return resolveExecutorFromCapabilities(required);
}

/**
 * Picks the highest-weight capability from `required` that exists in CAPABILITY_EXECUTOR_MAP.
 * If none found → throws (technical configuration error).
 */
export function resolveExecutorFromCapabilities(required: RequiredCapability[]): ExecutorType {
  const sorted = [...required].sort((a, b) => b.weight - a.weight);

  for (const req of sorted) {
    const executor = CAPABILITY_EXECUTOR_MAP[req.cap];
    if (executor !== undefined) {
      return executor;
    }
  }

  throw new ExecutionMapperError(
    "No supported capability found for AI execution. " +
    `Decision requires [${required.map((r) => r.cap).join(", ")}] but none map to an executor. ` +
    "This is a configuration error.",
  );
}

function resolveMaxRetries(verdict: Exclude<Verdict, "escalate">): number {
  return verdict === "human" ? HUMAN_DEFAULT_MAX_RETRIES : AI_DEFAULT_MAX_RETRIES;
}

function resolveTimeout(
  verdict: Exclude<Verdict, "escalate">,
  explicit?: number,
): number | undefined {
  if (explicit !== undefined) {
    return explicit;
  }

  return verdict === "human" ? undefined : AI_DEFAULT_TIMEOUT_MS;
}
