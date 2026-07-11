import { ApiFail, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeFlow, type DoneEvent, type Flow } from "@/lib/metrics";
import type { TaskRow } from "@/lib/db-types";

// GET /metrics/flow → {completed, leadTimeMsP50, leadTimeMsAvg, throughput, windowDays}
// (Owner: B, additive) DORA-style. Lead time from status='done' logs vs task.created_at.
export const GET = route(async () => {
  const sb = supabaseAdmin();
  const [tasksR, logsR] = await Promise.all([
    sb.from("tasks").select("id, created_at"),
    sb.from("logs").select("task_id, created_at").eq("kind", "status").filter("payload->>status", "eq", "done"),
  ]);
  for (const r of [tasksR, logsR]) if (r.error) throw new ApiFail("internal_error", r.error.message);

  const createdById = new Map(
    (tasksR.data as Pick<TaskRow, "id" | "created_at">[]).map((t) => [t.id, Date.parse(t.created_at)]),
  );
  const events: DoneEvent[] = [];
  for (const log of logsR.data as { task_id: string | null; created_at: string }[]) {
    if (!log.task_id) continue;
    const created = createdById.get(log.task_id);
    if (created == null) continue;
    const doneAt = Date.parse(log.created_at);
    events.push({ leadMs: doneAt - created, doneAt });
  }
  return ok<Flow>(computeFlow(events, Date.now()));
});
