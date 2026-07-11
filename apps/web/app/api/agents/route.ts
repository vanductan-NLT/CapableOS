import { ApiFail, jsonBody, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newAgentSchema } from "@/lib/schemas";
import { agentId } from "@/lib/slug";
import type { AgentRow } from "@/lib/db-types";
import { toAgent } from "@/lib/row-mappers";
import type { Agent } from "@orchestra/contracts";

// GET /agents → Agent[]   (Owner: B, FR-13 — Capability Pool)
export const GET = route(async () => {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("agents").select("*").order("type").order("name");
  if (error) throw new ApiFail("internal_error", error.message);
  return ok<Agent[]>((data as AgentRow[]).map(toAgent));
});

// POST /agents {type,name,...} → Agent   (Owner: B, FR-13)
export const POST = route(async (req: Request) => {
  const body = await jsonBody(req, newAgentSchema);
  const sb = supabaseAdmin();
  const id = body.id ?? agentId(body.type, body.name);
  const { data, error } = await sb
    .from("agents")
    .insert({
      id,
      type: body.type,
      name: body.name,
      role: body.role ?? null,
      trust: body.trust ?? 80,
      cost: body.cost ?? null,
      minutes: body.minutes ?? null,
      caps: body.caps ?? {},
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new ApiFail("conflict", `Agent id "${id}" đã tồn tại`);
    throw new ApiFail("internal_error", error.message);
  }
  return ok<Agent>(toAgent(data as AgentRow), { status: 201 });
});
