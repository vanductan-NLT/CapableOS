import { ApiFail, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeBreakdown, type SideStat, type TaskRecord } from "@/lib/metrics";
import type { AgentRow, ExecutionRow, FeedbackRow, TaskRow } from "@/lib/db-types";

// GET /metrics/breakdown → { human, ai }   (Owner: B, additive — dashboard "Người vs AI" table)
export const GET = route(async () => {
  const sb = supabaseAdmin();
  const [tasksR, agentsR, execR, fbR] = await Promise.all([
    sb.from("tasks").select("id, assignee_id"),
    sb.from("agents").select("id, type, minutes, cost"),
    sb.from("executions").select("task_id, ms, cost"),
    sb.from("feedback").select("task_id, rating, created_at").order("created_at", { ascending: true }),
  ]);
  for (const r of [tasksR, agentsR, execR, fbR]) if (r.error) throw new ApiFail("internal_error", r.error.message);

  const agentsById = new Map(
    (agentsR.data as Pick<AgentRow, "id" | "type" | "minutes" | "cost">[]).map((a) => [a.id, a]),
  );
  const execByTask = new Map<string, Pick<ExecutionRow, "ms" | "cost">>();
  for (const e of execR.data as ExecutionRow[]) if (!execByTask.has(e.task_id)) execByTask.set(e.task_id, e);
  const ratingByTask = new Map<string, "pass" | "fail">();
  for (const f of fbR.data as FeedbackRow[]) ratingByTask.set(f.task_id, f.rating); // ascending → last wins = latest

  const records: TaskRecord[] = (tasksR.data as Pick<TaskRow, "id" | "assignee_id">[]).map((t) => {
    const agent = t.assignee_id ? agentsById.get(t.assignee_id) : undefined;
    const side = agent?.type ?? null;
    const rating = ratingByTask.get(t.id) ?? null;
    if (side === "ai") {
      const ex = execByTask.get(t.id);
      return {
        side,
        minutes: ex?.ms != null ? Math.round(ex.ms / 60000) : null,
        cost: ex?.cost ?? null,
        rating,
        estimated: false,
      };
    }
    if (side === "human") {
      return { side, minutes: agent?.minutes ?? null, cost: agent?.cost ?? null, rating, estimated: true };
    }
    return { side: null, minutes: null, cost: null, rating, estimated: false };
  });

  return ok<{ human: SideStat; ai: SideStat }>(computeBreakdown(records));
});
