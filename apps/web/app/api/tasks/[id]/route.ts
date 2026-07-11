import { ApiFail, jsonBody, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { patchTaskSchema } from "@/lib/schemas";
import type { TaskRow } from "@/lib/db-types";
import { toTask } from "@/lib/row-mappers";
import type { Task } from "@orchestra/contracts";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /tasks/:id {status? assignee_id? result?} → Task   (Owner: B, FR-8/FR-10)
export const PATCH = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const patch = await jsonBody(req, patchTaskSchema);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("tasks").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new ApiFail("internal_error", error.message);
  if (!data) throw new ApiFail("not_found", `Không tìm thấy task ${id}`);

  // Observability (mục 24) + enables flow metrics (lead time): log status transitions.
  if (patch.status) {
    const { error: logErr } = await sb.from("logs").insert({
      kind: "status",
      task_id: id,
      trace_id: crypto.randomUUID(),
      payload: { status: patch.status },
    });
    if (logErr) console.error("status log failed (non-fatal):", logErr.message);
  }
  return ok<Task>(toTask(data as TaskRow));
});
