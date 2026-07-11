// Row shapes for Supabase queries (no generated types yet → cast query results to these).
import type {
  DecisionPersistenceInput,
  ExecutionStatus,
  ExecutorType,
  ReviewOutcome,
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
  id: string;
  task_id: string;
  decision_id: string | null;
  verdict: Verdict | null;
  executor: ExecutorType | null;
  assignee_id: string | null;
  reviewer_id: string | null;
  status: ExecutionStatus;
  attempt: number;
  max_retries: number;
  root_execution_id: string | null;
  previous_execution_id: string | null;
  input: unknown;
  output: string | null;
  error_code: string | null;
  error_message: string | null;
  tokens: number | null;
  cost: number | null;
  ms: number | null;
  trace_id: string | null;
  timeout_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  review_outcome: ReviewOutcome | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}
export interface FeedbackRow {
  task_id: string;
  rating: "pass" | "fail";
  created_at: string;
}
