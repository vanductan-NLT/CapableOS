import { ApiFail, ok, route } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AgentRow } from "@/lib/db-types";
import type { CapabilitiesResult } from "@orchestra/contracts";

// GET /capabilities → string[]   (Owner: B — distinct capability keys across the Pool)
export const GET = route(async () => {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("agents").select("caps");
  if (error) throw new ApiFail("internal_error", error.message);
  const set = new Set<string>();
  for (const row of data as Pick<AgentRow, "caps">[]) {
    for (const k of Object.keys(row.caps ?? {})) set.add(k);
  }
  return ok<CapabilitiesResult>([...set].sort());
});
