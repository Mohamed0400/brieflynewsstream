/**
 * Smoke Lemon Squeezy billing: invoice → checkout URL → webhook marks paid.
 *
 *   dotenv -e .env -- tsx scripts/smoke-billing.ts
 */
import { getOrCreateAccount } from "../src/lib/account";
import {
  payCustomerInvoice,
  requestProInvoice,
  markInvoicePaidFromProvider,
  getAccountInvoice,
} from "../src/lib/billing/invoices";
import { billingProviderReady } from "../src/lib/billing/types";
import { prisma } from "../src/lib/prisma";

const email = (process.env.CONSOLE_E2E_EMAIL || "console-e2e@briefly.local").trim().toLowerCase();

async function main() {
  console.log("billing_provider_ready", billingProviderReady());
  if (!billingProviderReady()) {
    throw new Error("Billing provider not ready — check LEMONSQUEEZY_* env vars");
  }

  const account = await prisma.account.findFirst({ where: { email } });
  if (!account) {
    throw new Error(`No account for ${email} — sign up or run auth:ensure-user`);
  }

  let invoice = await prisma.invoice.findFirst({
    where: { accountId: account.id, status: "OPEN", example: false },
    orderBy: { issuedAt: "desc" },
  });
  if (!invoice) {
    invoice = await requestProInvoice(account.id);
    console.log("invoice_created", invoice.number);
  } else {
    console.log("invoice_reused", invoice.number);
  }

  const pay = await payCustomerInvoice(account.id, invoice.id);
  if ("error" in pay) {
    throw new Error(`payCustomerInvoice failed: ${pay.error}`);
  }
  if (!("checkoutUrl" in pay) || !pay.checkoutUrl) {
    throw new Error("Missing checkoutUrl from payCustomerInvoice");
  }
  console.log("checkout_ok", pay.checkoutUrl.startsWith("https://"));
  console.log("checkout_host", new URL(pay.checkoutUrl).hostname);

  const webhook = await markInvoicePaidFromProvider({
    invoiceId: invoice.id,
    provider: "lemonsqueezy",
    providerRef: "ls_smoke_test",
    method: "lemonsqueezy",
  });
  if ("error" in webhook) {
    throw new Error(`markInvoicePaidFromProvider failed: ${webhook.error}`);
  }

  const updated = await getAccountInvoice(account.id, invoice.id);
  const acct = await prisma.account.findUnique({ where: { id: account.id } });
  console.log("invoice_status", updated?.status);
  console.log("account_plan", acct?.plan);

  if (updated?.status !== "PAID" || acct?.plan !== "PRO") {
    throw new Error("Expected PAID invoice and PRO plan after webhook simulation");
  }

  console.log("billing_smoke_passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
