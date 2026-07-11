import { ApiFail, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeReputation, type FeedbackEvent, type Reputation } from "@/lib/reputation";
import type { FeedbackRow, TaskRow } from "@/lib/db-types";

// GET /agents/reputation → { [agentId]: Reputation }   (Owner: B, additive)
// Confidence-aware reputation from the immutable feedback log (Wilson/Bayesian/EWMA).
// Does NOT change agents.trust (which domain A's Router reads) — this is a richer B-side view.
export const GET = route(async () => {
  const sb = supabaseAdmin();
  const [tasksR, fbR] = await Promise.all([
    sb.from("tasks").select("id, assignee_id"),
    sb.from("feedback").select("task_id, rating, created_at"),
  ]);
  for (const r of [tasksR, fbR]) if (r.error) throw new ApiFail("internal_error", r.error.message);

  const assigneeByTask = new Map(
    (tasksR.data as Pick<TaskRow, "id" | "assignee_id">[]).map((t) => [t.id, t.assignee_id]),
  );
  const byAgent = new Map<string, FeedbackEvent[]>();
  for (const f of fbR.data as FeedbackRow[]) {
    const agentId = assigneeByTask.get(f.task_id);
    if (!agentId) continue;
    const list = byAgent.get(agentId) ?? [];
    list.push({ rating: f.rating, at: Date.parse(f.created_at) });
    byAgent.set(agentId, list);
  }

  const result: Record<string, Reputation> = {};
  for (const [agentId, events] of byAgent) result[agentId] = computeReputation(events);
  return ok<Record<string, Reputation>>(result);
});
