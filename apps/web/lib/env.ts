// Lazy env access — never throw at import time so `next build` works without secrets.

function req(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env ${name}. Copy .env.example → .env.local.`);
  return value;
}

// NEXT_PUBLIC_* must be referenced statically so Next inlines them.
export const supabaseUrl = () => req("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = () =>
  req("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseServiceRoleKey = () =>
  req("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);

/** True when Supabase is configured — pages can show a friendly "cần cấu hình" state. */
export const hasSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
