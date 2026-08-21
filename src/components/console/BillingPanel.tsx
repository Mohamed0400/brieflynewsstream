"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { BILLING_CONTACT, formatUsd } from "@/lib/billing/types";
import { PLAN_DEFINITIONS } from "@/lib/plans";

type InvoiceRow = {
  id: string;
  number: string;
  status: "OPEN" | "PAID" | "VOID";
  description: string;
  totalCents: number;
  issuedAt: string;
  paidAt: string | null;
  example: boolean;
  receiptAvailable: boolean;
};

type BillingProps = {
  plan: keyof typeof PLAN_DEFINITIONS;
  status: string;
  usedToday: number;
  dailyLimit: number;
  activeKeys: number;
  maxKeys: number;
  listPriceMonthlyUsd: number | null;
  invoices: InvoiceRow[];
  paymentsLive: boolean;
};

function statusTone(status: InvoiceRow["status"]) {
  if (status === "PAID") return "paid";
  if (status === "VOID") return "void";
  return "open";
}

export function BillingPanel({
  plan,
  status: _status,
  usedToday,
  dailyLimit,
  activeKeys,
  maxKeys,
  listPriceMonthlyUsd,
  invoices: initialInvoices,
  paymentsLive,
}: BillingProps) {
  const router = useRouter();
  const { copy, lang } = useConsoleCopy();
  const t = copy.billing;
  const [invoices, setInvoices] = useState(initialInvoices);
  const [checkout, setCheckout] = useState<InvoiceRow | null>(
    () => initialInvoices.find((row) => row.status === "OPEN") ?? null,
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const remaining = Math.max(0, dailyLimit - usedToday);
  const usagePct = dailyLimit > 0 ? Math.min(100, Math.round((usedToday / dailyLimit) * 100)) : 0;
  const locale = lang === "en" ? "en-US" : "ar";
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );
  const statusLabel = {
    OPEN: t.statusOpen,
    PAID: t.statusPaid,
    VOID: t.statusVoid,
  } as const;
  const proCents = (PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd ?? 70) * 100;
  const payLabel = `${t.pay} ${formatUsd(proCents)}`;

  async function openUpgrade() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/console/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "PRO" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.message || payload.error || t.requestFailed);
        return;
      }
      const next = payload.item as InvoiceRow;
      setInvoices((current) => {
        if (current.some((row) => row.id === next.id)) return current;
        return [next, ...current];
      });
      setCheckout(next);
    } catch {
      setMessage(t.requestFailed);
    } finally {
      setBusy(false);
    }
  }

  async function act(invoiceId: string, action: "pay" | "cancel") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/console/billing/invoices/${invoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.message || payload.error || t.payFailed);
        return;
      }
      if (action === "cancel") {
        setCheckout(null);
        setMessage(t.cancelledOpen);
        return;
      }
      router.push(`/console/billing/success?invoice=${invoiceId}`);
      router.refresh();
    } catch {
      setMessage(t.payFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{t.kicker}</p>
        <h1>{t.heading}</h1>
        <p>{t.description}</p>
      </header>

      <section className="console-metric-grid" aria-label={t.usageTitle}>
        <article className="console-metric console-metric-primary">
          <span>{t.currentPlan}</span>
          <strong className="console-word-metric">{PLAN_DEFINITIONS[plan].label}</strong>
          <small>
            {listPriceMonthlyUsd != null
              ? `${formatUsd(listPriceMonthlyUsd * 100)} / ${t.month}`
              : t.customPrice}
          </small>
        </article>
        <article className="console-metric">
          <span>{t.requestsToday}</span>
          <strong dir="ltr">
            {usedToday.toLocaleString("en-US")} / {dailyLimit.toLocaleString("en-US")}
          </strong>
          <small>{t.remaining(remaining)} · {usagePct}%</small>
        </article>
        <article className="console-metric">
          <span>{t.activeKeys}</span>
          <strong dir="ltr">
            {activeKeys} / {maxKeys}
          </strong>
          <small>{t.usageTitle}</small>
        </article>
      </section>

      {plan === "FREE" ? (
        <section className="console-panel" aria-labelledby="billing-upgrade-title">
          <div className="console-panel-heading">
            <div>
              <h2 id="billing-upgrade-title">{t.upgradeTitle}</h2>
              <p>{t.upgradeHint}</p>
            </div>
          </div>
          {checkout ? (
            <div className="billing-checkout">
              <p className="billing-checkout-amount" dir="ltr">
                {formatUsd(checkout.totalCents)}
              </p>
              <p className="console-help">{paymentsLive ? t.gatewayLive : t.gatewayPending}</p>
              <div className="console-inline-actions">
                {paymentsLive ? (
                  <button
                    type="button"
                    className="console-primary-button"
                    disabled={busy}
                    onClick={() => void act(checkout.id, "pay")}
                  >
                    {busy ? t.paying : payLabel}
                  </button>
                ) : (
                  <a
                    className="console-primary-button"
                    href={`mailto:${BILLING_CONTACT}?subject=${encodeURIComponent("Pro plan upgrade")}`}
                  >
                    {t.contactCta}
                  </a>
                )}
                <button
                  type="button"
                  className="console-secondary-button"
                  disabled={busy}
                  onClick={() => void act(checkout.id, "cancel")}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="console-inline-actions">
              <button
                type="button"
                className="console-primary-button"
                disabled={busy}
                onClick={() => void openUpgrade()}
              >
                {busy ? t.requesting : t.upgradeCta}
              </button>
              <Link className="console-secondary-button" href={lang === "en" ? "/console/keys?lang=en" : "/console/keys"}>
                {t.manageKeys}
              </Link>
            </div>
          )}
        </section>
      ) : null}

      <aside className="console-policy-note" aria-label={t.waitingTitle}>
        <strong>{t.waitingTitle}</strong>
        <p>{t.waitingBody}</p>
      </aside>

      <section className="console-panel" aria-labelledby="billing-history-title">
        <div className="console-panel-heading">
          <div>
            <h2 id="billing-history-title">{t.historyTitle}</h2>
            <p>{t.historyHint}</p>
          </div>
        </div>
        <ul className="billing-status-legend">
          <li><span data-status="open">{t.statusOpen}</span> {t.statusOpenHint}</li>
          <li><span data-status="void">{t.statusVoid}</span> {t.statusVoidHint}</li>
          <li><span data-status="paid">{t.statusPaid}</span> {t.statusPaidHint}</li>
        </ul>
        {invoices.length === 0 ? (
          <div className="console-empty-state console-empty-state-compact">
            <strong>{t.emptyTitle}</strong>
            <p>{t.emptyHint}</p>
          </div>
        ) : (
          <div className="console-key-list">
            {invoices.map((invoice) => (
              <article key={invoice.id} className="console-key-row billing-invoice-row">
                <div className="console-key-identity">
                  <strong>{invoice.description}</strong>
                  <code dir="ltr">{invoice.number}</code>
                  <p className="console-key-meta">
                    {dateFmt.format(new Date(invoice.issuedAt))}
                  </p>
                </div>
                <p className="billing-invoice-amount" dir="ltr">
                  {formatUsd(invoice.totalCents)}
                </p>
                <span className="billing-status" data-status={statusTone(invoice.status)}>
                  {statusLabel[invoice.status]}
                </span>
                <div className="console-inline-actions">
                  {invoice.status === "OPEN" ? (
                    <>
                      {paymentsLive ? (
                        <button
                          type="button"
                          className="console-primary-button"
                          disabled={busy}
                          onClick={() => void act(invoice.id, "pay")}
                        >
                          {t.pay}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="console-secondary-button"
                        disabled={busy}
                        onClick={() => void act(invoice.id, "cancel")}
                      >
                        {t.cancel}
                      </button>
                    </>
                  ) : invoice.receiptAvailable ? (
                    <a
                      className="console-secondary-button"
                      href={`/api/console/billing/invoices/${invoice.id}/receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.openReceipt}
                    </a>
                  ) : (
                    <span className="billing-receipt-wait">
                      {invoice.status === "VOID" ? t.receiptVoid : t.receiptWaiting}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {message ? <p className="console-muted" role="status">{message}</p> : null}
    </div>
  );
}
