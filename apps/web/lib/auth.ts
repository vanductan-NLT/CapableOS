import { ApiFail } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Requires an authenticated user and returns their ID.
 * Single call to auth.getUser() — no duplication.
 * Throws ApiFail("unauthorized") if not authenticated.
 */
export async function requireAuthenticatedUserId(): Promise<string> {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();

  if (error || !data.user) {
    throw new ApiFail("unauthorized", "Unauthorized");
  }

  return data.user.id;
}

/**
 * @deprecated Use requireAuthenticatedUserId() instead.
 * Kept for backward compatibility with existing route handlers.
 */
export async function requireAuthenticatedUser(): Promise<void> {
  await requireAuthenticatedUserId();
}
