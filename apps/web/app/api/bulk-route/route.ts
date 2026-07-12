// POST /api/tasks/bulk-route — Re-route all tasks that are stuck in 'created' or escalated 'routed'.
// Resets escalated tasks back to 'created' and runs pipeline on them.

import { ok, route } from "../../../../lib/api";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { createQwenPlannerOptions } from "../../../../lib/decision/planner-options";
import { createProductionRouteDecisionService } from "../../../../lib/decision/production-service";
import type { DecisionResponse } from "@orchestra/contracts";

interface BulkRouteResult {
  total: number;
  routed: number;
  failed: number;
  errors: string[];
}

export const POST = route(async () => {
  const sb = supabaseAdmin();

  // 1. Find all tasks stuck in 'created' status
  const { data: createdTasks, error: e1 } = await sb
    .from("tasks")
    .select("id")
    .eq("status", "created");
  if (e1) throw new Error(e1.message);

  // 2. Find all tasks in 'routed' with escalated decisions (chosen=[])
  const { data: escalatedTasks, error: e2 } = await sb
    .from("tasks")
    .select("id, decision_id")
    .eq("status", "routed")
    .is("assignee_id", null);
  if (e2) throw new Error(e2.message);

  // Reset escalated tasks: delete their decisions and set status back to 'created'
  for (const t of escalatedTasks ?? []) {
    if (t.decision_id) {
      await sb.from("decisions").delete().eq("id", t.decision_id);
    }
    await sb.from("tasks").update({ status: "created", decision_id: null }).eq("id", t.id);
  }

  // 3. Collect all task IDs to route
  const allIds = [
    ...(createdTasks ?? []).map((t) => t.id),
    ...(escalatedTasks ?? []).map((t) => t.id),
  ];
  const uniqueIds = [...new Set(allIds)];

  let routed = 0;
  let failed = 0;
  const errors: string[] = [];

  // 4. Route each task
  const service = createProductionRouteDecisionService(createQwenPlannerOptions);

  for (const taskId of uniqueIds) {
    try {
      const decision: DecisionResponse = await service.routeTask(taskId);
      // Set assignee from chosen
      if (decision.chosen.length > 0) {
        await sb.from("tasks").update({ assignee_id: decision.chosen[0] }).eq("id", taskId);
      }
      routed++;
    } catch (e) {
      failed++;
      errors.push(`${taskId}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return ok<BulkRouteResult>({ total: uniqueIds.length, routed, failed, errors: errors.slice(0, 10) });
});
