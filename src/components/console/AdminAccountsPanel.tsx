"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import type { AdminCustomerSnapshot } from "@/components/console/AdminCustomersPanel";
import { PLAN_DEFINITIONS } from "@/lib/plans";

type AdminBusyAction = "save" | "pay" | "void" | null;

export function AdminAccountsPanel({
  email,
  account,
  invoiceId: invoiceIdProp,
  onEmailChange,
  onInvoiceIdChange,
  onSaved,
  quotaResetSlot,
}: {
  email?: string;
  account?: AdminCustomerSnapshot | null;
  invoiceId?: string;
  onEmailChange?: (email: string) => void;
  onInvoiceIdChange?: (invoiceId: string) => void;
  onSaved?: () => void;
  quotaResetSlot?: ReactNode;
} = {}) {
  const { copy } = useConsoleCopy();
  const t = copy.billing;
  const [localEmail, setLocalEmail] = useState("");
  const emailValue = email ?? localEmail;
  const setEmail = onEmailChange ?? setLocalEmail;
  const [localInvoiceId, setLocalInvoiceId] = useState("");
  const invoiceId = invoiceIdProp ?? localInvoiceId;
  const setInvoiceId = onInvoiceIdChange ?? setLocalInvoiceId;
  const [nextPlan, setNextPlan] = useState<keyof typeof PLAN_DEFINITIONS>("FREE");
  const [nextStatus, setNextStatus] = useState("ACTIVE");
  const [dailyOverride, setDailyOverride] = useState("");
  const [keysOverride, setKeysOverride] = useState("");
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<AdminBusyAction>(null);
  const busy = busyAction !== null;

  useEffect(() => {
    if (!account) return;
    setNextPlan(account.plan);
    setNextStatus(account.status);
    setDailyOverride(
      account.dailyPointsOverride != null ? String(account.dailyPointsOverride) : "",
    );
    setKeysOverride(account.maxKeysOverride != null ? String(account.maxKeysOverride) : "");
    const openInvoice = account.invoices.find((invoice) => invoice.status === "OPEN");
    if (openInvoice) setInvoiceId(openInvoice.id);
  }, [account, setInvoiceId]);

  async function saveAdmin() {
    setBusyAction("save");
    setMessage("");
    try {
      const response = await fetch("/api/console/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue.trim() || undefined,
          plan: nextPlan,
          status: nextStatus,
          dailyPointsOverride: dailyOverride.trim() === "" ? undefined : Number(dailyOverride),
          maxKeysOverride: keysOverride.trim() === "" ? undefined : Number(keysOverride),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.message || payload.error || t.adminFailed);
      } else {
        setMessage(t.adminSaved(payload.item?.email || emailValue));
        onSaved?.();
      }
    } catch {
      setMessage(t.adminFailed);
    } finally {
      setBusyAction(null);
    }
  }

  async function adminInvoice(action: "pay" | "void") {
    setBusyAction(action === "pay" ? "pay" : "void");
    setMessage("");
    try {
      const response = await fetch("/api/console/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoiceId.trim(), action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.message || payload.error || t.adminFailed);
        return;
      }
      setMessage(action === "pay" ? t.markedPaid : t.markedVoid);
      onSaved?.();
    } catch {
      setMessage(t.adminFailed);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <section className="console-panel" aria-labelledby="ops-accounts-title">
        <div className="console-panel-heading">
          <div>
            <h2 id="ops-accounts-title">{t.adminTitle}</h2>
            <p>{t.adminHint}</p>
          </div>
        </div>
        <div className="console-form-grid">
          <label>
            <span>{t.adminEmail}</span>
            <input
              className="console-input"
              value={emailValue}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
            />
          </label>
          <label>
            <span>{t.adminPlan}</span>
            <select
              className="console-input"
              value={nextPlan}
              onChange={(event) => setNextPlan(event.target.value as keyof typeof PLAN_DEFINITIONS)}
            >
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </label>
          <label>
            <span>{t.adminStatus}</span>
            <select
              className="console-input"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label>
            <span>{t.adminDailyOverride}</span>
            <input
              className="console-input"
              value={dailyOverride}
              onChange={(event) => setDailyOverride(event.target.value)}
              placeholder={t.adminOverridePlaceholder}
            />
          </label>
          <label>
            <span>{t.adminKeysOverride}</span>
            <input
              className="console-input"
              value={keysOverride}
              onChange={(event) => setKeysOverride(event.target.value)}
              placeholder={t.adminOverridePlaceholder}
            />
          </label>
        </div>
        <div className="console-inline-actions ops-account-actions">
          <button
            type="button"
            className="console-primary-button"
            disabled={busy || !emailValue.trim()}
            onClick={() => void saveAdmin()}
          >
            {busyAction === "save" ? t.adminSaving : t.adminSave}
          </button>
          {quotaResetSlot}
        </div>
      </section>

      <section className="console-panel" aria-labelledby="ops-invoice-title">
        <div className="console-panel-heading">
          <div>
            <h2 id="ops-invoice-title">{copy.opsInvoiceTitle}</h2>
            <p>{copy.opsInvoiceHint}</p>
          </div>
        </div>
        <div className="console-form-grid">
          <label>
            <span>{copy.opsInvoiceId}</span>
            <input
              className="console-input"
              value={invoiceId}
              onChange={(event) => setInvoiceId(event.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="console-inline-actions">
          <button
            type="button"
            className="console-primary-button"
            disabled={busy || !invoiceId.trim()}
            onClick={() => void adminInvoice("pay")}
          >
            {busyAction === "pay" ? t.markingPaid : t.markPaid}
          </button>
          <button
            type="button"
            className="console-danger-button"
            disabled={busy || !invoiceId.trim()}
            onClick={() => void adminInvoice("void")}
          >
            {busyAction === "void" ? t.voiding : t.markVoid}
          </button>
        </div>
      </section>
      {message ? (
        <p className="console-muted" role="status">
          {message}
        </p>
      ) : null}
    </>
  );
}
