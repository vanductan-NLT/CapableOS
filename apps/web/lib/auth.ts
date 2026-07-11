import { ApiFail } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";

export async function requireAuthenticatedUser(): Promise<void> {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();

  if (error || !data.user) {
    throw new ApiFail("unauthorized", "Unauthorized");
  }
}
