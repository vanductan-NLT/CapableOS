"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

// Browser client (anon key, RLS enforced). Used for realtime subscriptions.
export function supabaseBrowser() {
  if (!cached) cached = createBrowserClient(supabaseUrl(), supabaseAnonKey());
  return cached;
}
