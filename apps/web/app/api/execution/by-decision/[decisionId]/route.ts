import type { ExecutionStatus, Verdict } from "@orchestra/contracts";
import { ApiFail, ok, route } from "@/lib/api";
import { decisionIdSchema } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ decisionId: string }> };

interface ExecutionLookup {
  execution_id: string;
  task_id: string;
  status: ExecutionStatus;
  verdict: Verdict | null;
}

export const GET = route<Ctx>(async (_req, ctx) => {
  const { decisionId } = await ctx.params;
  const parsed = decisionIdSchema.safeParse(decisionId);
  if (!parsed.success) {
    throw new ApiFail("validation_error", parsed.error.issues[0]?.message ?? "decision_id không hợp lệ");
  }

  const { data, error } = await supabaseAdmin()
    .from("executions")
    .select("id, task_id, status, verdict, created_at")
    .eq("decision_id", decisionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new ApiFail("internal_error", error.message);
  if (!data) throw new ApiFail("not_found", "Chưa có execution để duyệt cho quyết định này");

  return ok<ExecutionLookup>({
    execution_id: data.id,
    task_id: data.task_id,
    status: data.status,
    verdict: data.verdict,
  });
});
