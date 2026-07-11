import { ApiFail, jsonBody, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createTaskSchema, TASK_STATUSES } from "@/lib/schemas";
import type { TaskRow } from "@/lib/db-types";
import { toTask } from "@/lib/row-mappers";
import type { Task } from "@orchestra/contracts";

// GET /tasks?status=  → Task[]   (Owner: B, FR-1/FR-10)
export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const sb = supabaseAdmin();
  let q = sb.from("tasks").select("*").order("created_at", { ascending: false });
  if (status) {
    if (!(TASK_STATUSES as readonly string[]).includes(status))
      throw new ApiFail("validation_error", `status không hợp lệ: ${status}`);
    q = q.eq("status", status);
  }
  const { data, error } = await q;
  if (error) throw new ApiFail("internal_error", error.message);
  return ok<Task[]>((data as TaskRow[]).map(toTask));
});

// POST /tasks {title, description?} → Task   (Owner: B, FR-1)
export const POST = route(async (req: Request) => {
  const body = await jsonBody(req, createTaskSchema);
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("tasks")
    .insert({ title: body.title, description: body.description ?? null })
    .select("*")
    .single();
  if (error) throw new ApiFail("internal_error", error.message);
  return ok<Task>(toTask(data as TaskRow), { status: 201 });
});
