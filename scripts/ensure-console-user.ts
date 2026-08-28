/**
 * Ensure a confirmed Supabase Auth user exists for local/E2E console login.
 *
 *   dotenv -e .env.live -- tsx scripts/ensure-console-user.ts
 *
 * Env:
 *   CONSOLE_E2E_EMAIL (default console-e2e@briefly.local)
 *   CONSOLE_E2E_PASSWORD (default from CONSOLE_E2E_PASSWORD or a fixed test password)
 *   SUPER_ADMIN_EMAILS — include the e2e email to unlock Schedule
 */
import { createServiceSupabaseClient } from "../src/lib/supabase/admin";
import { getOrCreateAccount } from "../src/lib/account";
import { ensureE2eQuotaApiKey, e2eQuotaApiKeyPlaintext } from "../src/lib/e2e-api-key";
import { prisma } from "../src/lib/prisma";

const email = (process.env.CONSOLE_E2E_EMAIL || "console-e2e@briefly.local").trim().toLowerCase();
const password = process.env.CONSOLE_E2E_PASSWORD || "BrieflyE2E!2026";

async function main() {
  const admin = createServiceSupabaseClient();

  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (list.error) throw list.error;

  let user = list.data.users.find((item) => item.email?.toLowerCase() === email);

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    user = created.data.user;
    console.log("Created confirmed auth user:", email);
  } else {
    const updated = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (updated.error) throw updated.error;
    user = updated.data.user;
    console.log("Updated existing auth user:", email);
  }

  if (!user?.id || !user.email) throw new Error("User missing id/email");

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  const apiKey = await ensureE2eQuotaApiKey(account.id);

  console.log({
    authUserId: user.id,
    accountId: account.id,
    email: account.email,
    role: account.role,
    plan: account.plan,
    passwordSet: true,
    quotaTestKeyId: apiKey.keyId,
    quotaTestKeyCreated: apiKey.created,
    quotaTestKeyPrefix: `${e2eQuotaApiKeyPlaintext().slice(0, 12)}…`,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
