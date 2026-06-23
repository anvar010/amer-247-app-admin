import { createClient } from "@supabase/supabase-js";

// Uses the service-role key so it can create users and bypass RLS.
// SUPABASE_SERVICE_ROLE_KEY must be set in .env.local (never expose it client-side).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
