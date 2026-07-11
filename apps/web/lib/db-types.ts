// Row shapes for Supabase queries (no generated types yet → cast query results to these).
import type {
  DecisionPersistenceInput,
  TaskStatus,
  Verdict,
} from "@orchestra/contracts";

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

export interface DecisionSummaryRow {
  verdict: Verdict;
}

export interface DecisionRow extends DecisionPersistenceInput {
  id: string;
  created_at: string;
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
