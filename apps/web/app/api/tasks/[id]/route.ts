import { ApiFail, jsonBody, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { patchTaskSchema } from "@/lib/schemas";
import { toTask, type TaskRow } from "@/lib/db-types";
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
  return ok<Task>(toTask(data as TaskRow));
});
