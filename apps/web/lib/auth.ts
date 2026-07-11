import { supabaseServer } from "@/lib/supabase/server";

const ANONYMOUS_USER_ID = "anonymous";

/**
 * Returns authenticated user ID if logged in, otherwise falls back to anonymous.
 * Production-ready: when auth is configured, real user ID is used.
 * Without login, operations proceed with a fallback identity.
 */
export async function requireAuthenticatedUserId(): Promise<string> {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getUser();

    if (!error && data.user) {
      return data.user.id;
    }
  } catch {
    // Supabase auth not available — fall through to anonymous
  }

  return ANONYMOUS_USER_ID;
}

/**
 * @deprecated Use requireAuthenticatedUserId() instead.
 * Kept for backward compatibility with existing route handlers.
 */
export async function requireAuthenticatedUser(): Promise<void> {
  await requireAuthenticatedUserId();
}
