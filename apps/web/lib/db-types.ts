// Row shapes for Supabase queries (no generated types yet → cast query results to these).
import type { Agent, Task, TaskStatus, Verdict } from "@orchestra/contracts";

export interface AgentRow {
  id: string;
  type: "human" | "ai";
  name: string;
  role: string | null;
  trust: number;
  cost: number | null;
  minutes: number | null;
  caps: Record<string, number>;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  decision_id: string | null;
  assignee_id: string | null;
  result: string | null;
  created_at: string;
}

export interface DecisionRow {
  verdict: Verdict;
}
export interface ExecutionRow {
  task_id: string;
  ms: number | null;
  cost: number | null;
}
export interface FeedbackRow {
  task_id: string;
  rating: "pass" | "fail";
  created_at: string;
}

export const toAgent = (r: AgentRow): Agent => ({
  id: r.id,
  type: r.type,
  name: r.name,
  role: r.role ?? undefined,
  trust: r.trust,
  cost: r.cost ?? undefined,
  minutes: r.minutes ?? undefined,
  caps: r.caps ?? {},
  created_at: r.created_at,
});

export const toTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  description: r.description ?? undefined,
  status: r.status,
  decision_id: r.decision_id ?? undefined,
  assignee_id: r.assignee_id ?? undefined,
  result: r.result ?? undefined,
  created_at: r.created_at,
});
