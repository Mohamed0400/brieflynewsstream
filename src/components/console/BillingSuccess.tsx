"use client";

import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";

export function BillingSuccess({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  const { copy } = useConsoleCopy();
  const t = copy.billing;

  return (
    <div className="billing-success">
      <CheckCircle className="billing-success-tick" size={72} weight="fill" aria-hidden="true" />
      <h1>{t.successHeading}</h1>
      <p>{t.successBody}</p>
      <p className="console-muted" dir="ltr">{invoiceNumber}</p>
      <div className="console-inline-actions billing-success-actions">
        <a
          className="console-primary-button"
          href={`/api/console/billing/invoices/${invoiceId}/receipt`}
          download
        >
          {t.downloadReceipt}
        </a>
        <Link href="/console/overview" className="console-secondary-button">
          {t.viewConsole}
        </Link>
      </div>
    </div>
  );
}
