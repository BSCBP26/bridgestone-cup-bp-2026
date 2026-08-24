import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import { AppError } from "../shared/app-error.js";

let adminClient;

export function createSupabaseAdminClient(url, serviceRoleKey) {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseAdminClient() {
  if (!env.supabaseConfigured) {
    throw new AppError(503, "Supabase is not configured");
  }
  adminClient ??= createSupabaseAdminClient(env.supabaseUrl, env.supabaseSecretKey);
  return adminClient;
}

export async function getSupabaseHealth() {
  if (!env.supabaseConfigured) return { status: "not_configured" };

  try {
    const client = getSupabaseAdminClient();
    const { error } = await client.from("sports").select("id").limit(1);
    return error ? { status: "unavailable" } : { status: "connected" };
  } catch {
    return { status: "unavailable" };
  }
}
