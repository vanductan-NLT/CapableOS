import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";

// Server-only. Service role bypasses RLS → used by API routes to write
// tasks/agents/feedback and read cross-domain tables. NEVER import in client code.
export function supabaseAdmin() {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
