// [S] Shared contract — Playbook mục 08. Founder B is primary author (Workspace domain).

export type TaskStatus =
  | "created"
  | "routed"
  | "executing"
  | "awaiting_approval"
  | "awaiting_human"
  | "review"
  | "done"
  | "rejected";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  decision_id?: string; // nối sang domain A
  assignee_id?: string; // người/agent đang xử lý
  result?: string; // output khi AI thực thi xong
  created_at: string;
}

export interface Feedback {
  task_id: string;
  rating: "pass" | "fail";
  note?: string;
}
