// [S] Shared contract — API envelope + endpoint request/response shapes (Playbook mục 11).
// Envelope is FIXED: { ok, data?, error? }. See docs/ADR/0001 for deviation from Nhi standard.

import type { Decision } from "./decision";
import type { TaskStatus, Feedback } from "./task";
import type { NewAgentInput, AgentPatch } from "./agent";

/** Machine-readable error codes. Errors NEVER return raw HTML to the client. */
export type ApiErrorCode =
  | "validation_error"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "upstream_error"
  | "internal_error";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

// ── Task endpoints (Owner: B) ───────────────────────────────
export interface CreateTaskBody {
  title: string;
  description?: string;
}
export interface ListTasksQuery {
  status?: TaskStatus;
}
export interface PatchTaskBody {
  status?: TaskStatus;
  assignee_id?: string;
  result?: string;
}

// ── Feedback endpoint (Owner: B) ────────────────────────────
export type FeedbackBody = Feedback;
export interface FeedbackResult {
  trust_delta: number;
  new_trust: number;
}

// ── Metrics endpoint (Owner: B) ─────────────────────────────
export type AllocationSplit = Record<"human" | "ai" | "hybrid" | "escalate", number>;

export interface Metrics {
  automation: number; // 0..1 tỷ lệ task giao AI/hybrid
  cost_saving: number; // ESTIMATED — tiền tiết kiệm so với all-human
  avg_ms: number; // thời gian trung bình mỗi execution
  split: AllocationSplit; // phân bổ verdict
  quality: number; // 0..1 tỷ lệ feedback "pass"
}

// ── Pool endpoints (Owner: B) ───────────────────────────────
export type CapabilitiesResult = string[];
export type CreateAgentBody = NewAgentInput;
export type PatchAgentBody = AgentPatch;

// ── Route / execute (Owner: A) — B chỉ gọi POST /route ──────
export interface RouteBody {
  task_id: string;
}
export type RouteResult = Decision;
