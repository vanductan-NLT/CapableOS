// [S] Shared contract — Governance gate (Phase 5 MVP).
// Hardcoded rules. No DB, no LLM, no async. Pure deterministic function.

import type { ExecutorType } from "./execution";

// ── Types ───────────────────────────────────────────────────

export type GovernanceGate = "allow" | "deny" | "approval";

export interface GovernanceCheckInput {
  action: string;
}

export interface GovernanceCheckResult {
  gate: GovernanceGate;
  reason: string;
}

// ── Hardcoded rules ─────────────────────────────────────────

const DENY_ACTIONS: ReadonlySet<string> = new Set([
  "delete_data",
  "delete_user",
  "modify_permissions",
]);

const APPROVAL_ACTIONS: ReadonlySet<string> = new Set([
  "send:email",
  "send_email",
  "external_communication",
]);

// ── Executor → action mapping ───────────────────────────────
/**
 * Maps executor type to the governance action string.
 * Only executors that trigger a non-allow gate need explicit mapping.
 * Unmapped executors default to their own name (which will hit "allow").
 */
const EXECUTOR_ACTION_MAP: Record<ExecutorType, string> = {
  email: "send:email",
  summarize: "summarize",
  research: "research",
  translate: "translate",
  meeting: "meeting",
};

// ── Public API ──────────────────────────────────────────────

/**
 * Resolves the governance action string from an executor type.
 * Used by the execute route to bridge executor → governance.
 */
export function resolveGovernanceAction(executor: ExecutorType): string {
  return EXECUTOR_ACTION_MAP[executor];
}

/**
 * Evaluates the governance gate for a given action.
 * Pure, synchronous, deterministic — no DB or LLM calls.
 */
export function checkGovernance(input: GovernanceCheckInput): GovernanceCheckResult {
  const { action } = input;

  if (DENY_ACTIONS.has(action)) {
    return {
      gate: "deny",
      reason: `Action "${action}" is prohibited by governance policy`,
    };
  }

  if (APPROVAL_ACTIONS.has(action)) {
    return {
      gate: "approval",
      reason: `Action "${action}" requires human approval before execution`,
    };
  }

  return {
    gate: "allow",
    reason: "Action is permitted by default governance policy",
  };
}
