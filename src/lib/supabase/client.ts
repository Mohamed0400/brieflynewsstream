import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
