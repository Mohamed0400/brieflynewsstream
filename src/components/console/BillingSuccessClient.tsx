"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";

type Props = {
  invoiceId: string;
  invoiceNumber: string;
  initialPaid: boolean;
};

export function BillingSuccessClient({
  invoiceId,
  invoiceNumber,
  initialPaid,
}: Props) {
  const router = useRouter();
  const { copy } = useConsoleCopy();
  const t = copy.billing;
  const [paid, setPaid] = useState(initialPaid);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (paid) return;
    let cancelled = false;
    let attempt = 0;

    async function poll() {
      attempt += 1;
      setTries(attempt);
      try {
        const response = await fetch(`/api/console/billing/invoices/${invoiceId}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok && payload.item?.status === "PAID") {
          setPaid(true);
          router.refresh();
          return;
        }
      } catch {
        // keep polling
      }
      if (!cancelled && attempt < 20) {
        window.setTimeout(poll, 1500);
      }
    }

    const timer = window.setTimeout(poll, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [invoiceId, paid, router]);

  if (!paid) {
    return (
      <div className="billing-success">
        <h1>Confirming payment</h1>
        <p>Lemon Squeezy is confirming your payment. This page updates automatically.</p>
        <p className="console-muted" dir="ltr">
          {invoiceNumber} · check {tries}/20
        </p>
        <div className="console-inline-actions billing-success-actions">
          <Link href="/console/billing" className="console-secondary-button">
            Back to billing
          </Link>
        </div>
      </div>
    );
  }

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
