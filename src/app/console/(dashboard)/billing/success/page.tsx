import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BillingSuccessClient } from "@/components/console/BillingSuccessClient";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getAccountInvoice } from "@/lib/billing/invoices";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.billing.successTitle };
}

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>;
}) {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");
  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });
  const { invoice: invoiceId } = await searchParams;
  if (!invoiceId) redirect("/console/billing");

  const invoice = await getAccountInvoice(account.id, invoiceId);
  if (!invoice || invoice.example) {
    redirect("/console/billing");
  }
  if (invoice.status === "VOID") {
    redirect("/console/billing");
  }

  return (
    <div className="console-page">
      <BillingSuccessClient
        invoiceId={invoice.id}
        invoiceNumber={invoice.number}
        initialPaid={invoice.status === "PAID"}
      />
    </div>
  );
}
