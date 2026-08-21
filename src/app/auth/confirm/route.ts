import { completeEmailAuth } from "@/lib/supabase/complete-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return completeEmailAuth(request);
}
