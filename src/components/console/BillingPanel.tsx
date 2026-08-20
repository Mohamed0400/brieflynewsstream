"use client";

import Link from "next/link";
import { useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { PLAN_DEFINITIONS } from "@/lib/plans";

type BillingProps = {
  plan: keyof typeof PLAN_DEFINITIONS;
  status: string;
  isAdmin: boolean;
  usedToday: number;
  dailyLimit: number;
  activeKeys: number;
  maxKeys: number;
  listPriceMonthlyUsd: number | null;
};

export function BillingPanel({
  plan,
  status,
  isAdmin,
  usedToday,
  dailyLimit,
  activeKeys,
  maxKeys,
  listPriceMonthlyUsd,
}: BillingProps) {
  const { copy, lang } = useConsoleCopy();
  const t = copy.billing;
  const [email, setEmail] = useState("");
  const [nextPlan, setNextPlan] = useState<keyof typeof PLAN_DEFINITIONS>("PRO");
  const [nextStatus, setNextStatus] = useState("ACTIVE");
  const [dailyOverride, setDailyOverride] = useState("");
  const [keysOverride, setKeysOverride] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const remaining = Math.max(0, dailyLimit - usedToday);
  const usagePct = dailyLimit > 0 ? Math.min(100, Math.round((usedToday / dailyLimit) * 100)) : 0;

  async function saveAdmin() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/console/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
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
        setMessage(t.adminSaved(payload.item?.email || email));
      }
    } catch {
      setMessage(t.adminFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="console-panel-stack">
      <header className="console-page-header">
        <p className="console-kicker">{t.kicker}</p>
        <h1>{t.heading}</h1>
        <p>{t.description}</p>
      </header>

      <section className="console-card" aria-labelledby="billing-plan-title">
        <h2 id="billing-plan-title">{t.currentPlan}</h2>
        <p className="console-muted">
          <strong>{PLAN_DEFINITIONS[plan].label}</strong>
          {listPriceMonthlyUsd != null ? ` · $${listPriceMonthlyUsd}/mo list` : ` · ${t.customPrice}`}
          {" · "}
          {status}
        </p>
        <p>{t.noCheckout}</p>
        <div className="console-inline-actions">
          <a className="console-primary-button" href="mailto:hello@brieflynewsstream.com">
            {t.contactCta}
          </a>
          <Link className="console-secondary-button" href={lang === "en" ? "/console/keys?lang=en" : "/console/keys"}>
            {t.manageKeys}
          </Link>
        </div>
      </section>

      <section className="console-card" aria-labelledby="billing-usage-title">
        <h2 id="billing-usage-title">{t.usageTitle}</h2>
        <dl className="console-metric-grid">
          <div>
            <dt>{t.requestsToday}</dt>
            <dd>
              {usedToday.toLocaleString()} / {dailyLimit.toLocaleString()}
            </dd>
            <p className="console-muted">{t.remaining(remaining)} · {usagePct}%</p>
          </div>
          <div>
            <dt>{t.activeKeys}</dt>
            <dd>
              {activeKeys} / {maxKeys}
            </dd>
          </div>
        </dl>
      </section>

      {isAdmin ? (
        <section className="console-card" aria-labelledby="billing-admin-title">
          <h2 id="billing-admin-title">{t.adminTitle}</h2>
          <p className="console-muted">{t.adminHint}</p>
          <div className="console-form-grid">
            <label>
              <span>{t.adminEmail}</span>
              <input
                className="console-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@example.com"
              />
            </label>
            <label>
              <span>{t.adminPlan}</span>
              <select className="console-input" value={nextPlan} onChange={(event) => setNextPlan(event.target.value as keyof typeof PLAN_DEFINITIONS)}>
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </label>
            <label>
              <span>{t.adminStatus}</span>
              <select className="console-input" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
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
          <button type="button" className="console-primary-button" disabled={busy || !email.trim()} onClick={() => void saveAdmin()}>
            {busy ? t.adminSaving : t.adminSave}
          </button>
          {message ? <p className="console-muted" role="status">{message}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
