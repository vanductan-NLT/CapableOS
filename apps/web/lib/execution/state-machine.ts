// Feature 4.1 — Execution state machine (pure function, no side effects).
// Source of truth for allowed transitions: packages/contracts/src/execution.ts

import {
  ALLOWED_TRANSITIONS,
  type ExecutionEvent,
  type ExecutionStatus,
} from "@orchestra/contracts";

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: ExecutionStatus,
    public readonly event: ExecutionEvent,
  ) {
    super(
      `Invalid transition: cannot apply event "${event}" to status "${from}"`,
    );
    this.name = "InvalidTransitionError";
  }
}

/**
 * Pure state transition function.
 * Given a current status and an event, returns the next status.
 * Throws InvalidTransitionError if the transition is forbidden.
 */
export function transition(
  current: ExecutionStatus,
  event: ExecutionEvent,
): ExecutionStatus {
  const rule = ALLOWED_TRANSITIONS.find(
    (t) => t.from === current && t.event === event,
  );

  if (rule === undefined) {
    throw new InvalidTransitionError(current, event);
  }

  return rule.to;
}

/**
 * Check whether a transition is allowed without throwing.
 */
export function canTransition(
  current: ExecutionStatus,
  event: ExecutionEvent,
): boolean {
  return ALLOWED_TRANSITIONS.some(
    (t) => t.from === current && t.event === event,
  );
}

/**
 * Returns all events applicable from a given status.
 */
export function availableEvents(current: ExecutionStatus): ExecutionEvent[] {
  return ALLOWED_TRANSITIONS
    .filter((t) => t.from === current)
    .map((t) => t.event);
}

/**
 * Check if a status is terminal (no further transitions possible).
 */
export function isTerminal(status: ExecutionStatus): boolean {
  return !ALLOWED_TRANSITIONS.some((t) => t.from === status);
}

/**
 * Check if a status is active (execution in progress, not terminal).
 */
export function isActive(status: ExecutionStatus): boolean {
  return status === "pending" || status === "running";
}
