/**
 * Smoke Supabase Auth + Account projection.
 *
 *   npm run auth:ensure-user
 *   npm run smoke:auth
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { createServiceSupabaseClient } from "../src/lib/supabase/admin";
import { getOrCreateAccount } from "../src/lib/account";
import { prisma } from "../src/lib/prisma";

const email = (process.env.CONSOLE_E2E_EMAIL || "console-e2e@briefly.local").trim().toLowerCase();
const password = process.env.CONSOLE_E2E_PASSWORD || "BrieflyE2E!2026";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const admin = createServiceSupabaseClient();
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find((item) => item.email?.toLowerCase() === email);
  if (!existing) {
    throw new Error(`Run npm run auth:ensure-user first (missing ${email})`);
  }

  const browser = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
  const { data, error } = await browser.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message || "signInWithPassword failed");

  const account = await getOrCreateAccount({
    authUserId: data.user.id,
    email: data.user.email!,
  });

  console.log("Auth smoke passed:", {
    email: account.email,
    role: account.role,
    plan: account.plan,
    status: account.status,
  });

  if (account.role !== "SUPER_ADMIN") {
    throw new Error("Expected SUPER_ADMIN — check SUPER_ADMIN_EMAILS includes the e2e email");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
