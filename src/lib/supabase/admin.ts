import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

/** Service-role client for admin Auth operations. Never expose to the browser. */
export function createServiceSupabaseClient() {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      // Node < 22 has no global WebSocket; Auth Admin does not need Realtime.
      transport: ws as unknown as typeof WebSocket,
    },
  });
}
