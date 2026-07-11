import type { Agent, Task } from "@orchestra/contracts";
import type { AgentRow, TaskRow } from "@/lib/db-types";

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
