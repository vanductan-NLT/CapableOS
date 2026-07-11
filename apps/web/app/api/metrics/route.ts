import { ApiFail, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeMetrics } from "@/lib/metrics";
import type { AgentRow, DecisionSummaryRow, ExecutionRow, FeedbackRow } from "@/lib/db-types";
import type { Metrics } from "@orchestra/contracts";

// GET /metrics → {automation, cost_saving, avg_ms, split, quality}   (Owner: B, FR-12)
export const GET = route(async () => {
  const sb = supabaseAdmin();
  const [dec, exe, fb, humans] = await Promise.all([
    sb.from("decisions").select("verdict"),
    sb.from("executions").select("ms, cost"),
    sb.from("feedback").select("rating"),
    sb.from("agents").select("cost").eq("type", "human"),
  ]);
  for (const r of [dec, exe, fb, humans]) if (r.error) throw new ApiFail("internal_error", r.error.message);

  const humanCosts = (humans.data as Pick<AgentRow, "cost">[]).map((h) => h.cost).filter((c): c is number => c != null);
  const humanBaselineCost = humanCosts.length ? humanCosts.reduce((a, b) => a + b, 0) / humanCosts.length : 0;

  const metrics = computeMetrics({
    decisions: dec.data as DecisionSummaryRow[],
    executions: exe.data as ExecutionRow[],
    feedback: fb.data as Pick<FeedbackRow, "rating">[],
    humanBaselineCost,
  });
  return ok<Metrics>(metrics);
});
