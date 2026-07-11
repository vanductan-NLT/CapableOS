import { ApiFail, jsonBody, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { feedbackSchema } from "@/lib/schemas";
import { applyFeedback } from "@/lib/trust";
import type { AgentRow, TaskRow } from "@/lib/db-types";
import type { FeedbackResult } from "@orchestra/contracts";

// POST /feedback {task_id, rating, note?} → {trust_delta, new_trust}   (Owner: B, FR-11)
// Trust is derived from the immutable feedback log: we record the delta, then apply to the assignee.
export const POST = route(async (req: Request) => {
  const body = await jsonBody(req, feedbackSchema);
  const sb = supabaseAdmin();

  const { data: task, error: te } = await sb
    .from("tasks")
    .select("id, assignee_id")
    .eq("id", body.task_id)
    .maybeSingle();
  if (te) throw new ApiFail("internal_error", te.message);
  if (!task) throw new ApiFail("not_found", `Không tìm thấy task ${body.task_id}`);

  const assigneeId = (task as Pick<TaskRow, "assignee_id">).assignee_id;
  let trust_delta = 0;
  let new_trust = 0;

  if (assigneeId) {
    const { data: agent, error: ae } = await sb
      .from("agents")
      .select("id, trust")
      .eq("id", assigneeId)
      .maybeSingle();
    if (ae) throw new ApiFail("internal_error", ae.message);
    if (agent) {
      const current = (agent as Pick<AgentRow, "trust">).trust;
      const applied = applyFeedback(current, body.rating);
      trust_delta = applied.delta;
      new_trust = applied.next;
      const { error: ue } = await sb.from("agents").update({ trust: new_trust }).eq("id", assigneeId);
      if (ue) throw new ApiFail("internal_error", ue.message);
    }
  }

  const { error: fe } = await sb.from("feedback").insert({
    task_id: body.task_id,
    rating: body.rating,
    trust_delta,
    note: body.note ?? null,
  });
  if (fe) throw new ApiFail("internal_error", fe.message);

  return ok<FeedbackResult>({ trust_delta, new_trust }, { status: 201 });
});
