import { ApiFail, jsonBody, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { patchAgentSchema } from "@/lib/schemas";
import { toAgent, type AgentRow } from "@/lib/db-types";
import type { Agent } from "@orchestra/contracts";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /agents/:id Partial<Agent> → Agent   (Owner: B, FR-13)
export const PATCH = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const patch = await jsonBody(req, patchAgentSchema);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("agents").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new ApiFail("internal_error", error.message);
  if (!data) throw new ApiFail("not_found", `Không tìm thấy agent ${id}`);
  return ok<Agent>(toAgent(data as AgentRow));
});
