"use client";

import { useEffect, useMemo, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { AdminQuotaResetButton } from "@/components/console/AdminSettingsPanel";
import { OpsPanelSkeleton } from "@/components/console/ops/OpsCharts";
import { BrandLoader } from "@/components/media/BrandLoader";
import { TRAFFIC_CHANNEL_LABELS, type TrafficChannel } from "@/lib/attribution";
import type { BillingKind } from "@/lib/admin-subscriptions";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { PLAN_DEFINITIONS } from "@/lib/plans";

type Customer = {
  id: string;
  email: string;
  role: string;
  status: string;
  plan: keyof typeof PLAN_DEFINITIONS;
  planSource: string;
  dailyPointsOverride: number | null;
  maxKeysOverride: number | null;
  country: string;
  address: string;
  mobilePhone: string;
  createdAt: string;
  trafficChannel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  signupReferrer: string;
  signupLandingPath: string;
  dailyLimit: number;
  maxKeys: number;
  paidInvoiceCount: number;
  billingKind: BillingKind;
  usageToday: { requests: number; points: number };
  usage7d: { requests: number; points: number };
  keys: Array<{
    id: string;
    name: string;
    prefix: string;
    lastFour: string;
    lastUsedAt: string | null;
    revokedAt: string | null;
  }>;
  subscription: {
    status: string;
    planTier: string;
    provider: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
  } | null;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    planTier: string;
    totalCents: number;
    issuedAt: string;
    paidAt: string | null;
  }>;
};

export type AdminCustomerSnapshot = Pick<
  Customer,
  "id" | "email" | "plan" | "status" | "dailyPointsOverride" | "maxKeysOverride" | "invoices"
>;

function countryLabel(code: string, lang: "ar" | "en") {
  const row = COUNTRY_CATALOG.find((item) => item.code === code);
  if (!row) return code || "—";
  return lang === "ar" ? row.nameAr : row.country;
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function channelLabel(channel: string, lang: "ar" | "en") {
  const key = channel as TrafficChannel;
  return TRAFFIC_CHANNEL_LABELS[key]?.[lang] || channel || "—";
}

export function AdminCustomersPanel({
  refreshKey = 0,
  onSelectCustomer,
  onSelectInvoice,
}: {
  refreshKey?: number;
  onSelectCustomer?: (customer: AdminCustomerSnapshot) => void;
  onSelectInvoice?: (invoiceId: string) => void;
}) {
  const { copy } = useConsoleCopy();
  const t = copy.customers;
  const s = copy.opsSubscriptions;
  const [items, setItems] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/console/admin/accounts");
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || payload.error || t.loadFailed);
        }
        if (!cancelled) setItems(payload.items || []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : t.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [t.loadFailed, refreshKey]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => {
      return [
        item.email,
        item.country,
        item.mobilePhone,
        item.address,
        item.plan,
        item.status,
        item.billingKind,
        item.trafficChannel,
        item.utmSource,
        item.utmMedium,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query]);

  const selected = filtered.find((item) => item.id === selectedId) || null;

  function billingLabel(kind: BillingKind) {
    return s.billingKind[kind] || kind;
  }

  return (
    <section className="console-panel ops-customers ops-panel-enter" aria-labelledby="ops-customers-title">
      <div className="console-panel-heading">
        <div>
          <h2 id="ops-customers-title">{t.title}</h2>
          <p>{t.hint}</p>
        </div>
        <p className="console-muted">{t.count(filtered.length)}</p>
      </div>

      <label className="ops-customers-search">
        <span className="visually-hidden">{t.search}</span>
        <input
          className="console-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
        />
      </label>

      {loading ? (
        <div className="ops-customers-loading">
          <OpsPanelSkeleton rows={5} />
          <div className="ops-loading ops-loading-overlay">
            <BrandLoader size="sm" label={t.loading} />
          </div>
        </div>
      ) : error ? (
        <p className="console-gate-error" role="alert">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="console-muted">{t.empty}</p>
      ) : (
        <div className="ops-customers-table-wrap">
          <table className="ops-customers-table">
            <thead>
              <tr>
                <th>{t.colEmail}</th>
                <th>{t.colCountry}</th>
                <th>{t.colMobile}</th>
                <th>{t.colPlan}</th>
                <th>{t.colBilling}</th>
                <th>{t.colUsage}</th>
                <th>{t.colUsage7d}</th>
                <th>{t.colSource}</th>
                <th>{t.colStatus}</th>
                <th>{t.colJoined}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  data-selected={item.id === selectedId ? "true" : "false"}
                  onClick={() => {
                    setSelectedId(item.id);
                    onSelectCustomer?.({
                      id: item.id,
                      email: item.email,
                      plan: item.plan,
                      status: item.status,
                      dailyPointsOverride: item.dailyPointsOverride,
                      maxKeysOverride: item.maxKeysOverride,
                      invoices: item.invoices,
                    });
                  }}
                >
                  <td className="ops-cell-email">
                    <span className="ops-email-text" dir="ltr" title={item.email}>{item.email}</span>
                    {item.role === "SUPER_ADMIN" ? <span className="ops-pill">{t.staff}</span> : null}
                  </td>
                  <td>{countryLabel(item.country, copy.lang)}</td>
                  <td className="ops-cell-mono" dir="ltr">{item.mobilePhone || "—"}</td>
                  <td>{item.plan}</td>
                  <td>
                    <span className="ops-billing-badge" data-kind={item.billingKind}>
                      {billingLabel(item.billingKind)}
                    </span>
                  </td>
                  <td>{item.usageToday.points}/{item.dailyLimit}</td>
                  <td>{item.usage7d.points.toLocaleString(copy.locale)}</td>
                  <td>{channelLabel(item.trafficChannel, copy.lang)}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString(copy.locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <article className="ops-customer-detail ops-detail-enter" aria-label={selected.email}>
          <div className="ops-customer-detail-head">
            <h3 className="ops-email-text" dir="ltr" title={selected.email}>{selected.email}</h3>
            <AdminQuotaResetButton accountId={selected.id} email={selected.email} />
          </div>

          <section className="ops-detail-section">
            <h4>{t.registrationTitle}</h4>
            <dl className="ops-customer-facts">
              <div>
                <dt>{t.colCountry}</dt>
                <dd>{countryLabel(selected.country, copy.lang)}</dd>
              </div>
              <div>
                <dt>{t.colMobile}</dt>
                <dd dir="ltr">{selected.mobilePhone || "—"}</dd>
              </div>
              <div className="ops-fact-wide">
                <dt>{t.colAddress}</dt>
                <dd>{selected.address || t.noAddress}</dd>
              </div>
              <div>
                <dt>{t.colJoined}</dt>
                <dd>{new Date(selected.createdAt).toLocaleString(copy.locale)}</dd>
              </div>
              <div>
                <dt>{t.colSource}</dt>
                <dd>{channelLabel(selected.trafficChannel, copy.lang)}</dd>
              </div>
            </dl>
          </section>

          <section className="ops-detail-section">
            <h4>{t.subscriptionTitle}</h4>
            <dl className="ops-customer-facts">
              <div>
                <dt>{t.colPlan}</dt>
                <dd>{selected.plan}</dd>
              </div>
              <div>
                <dt>{t.colBilling}</dt>
                <dd>
                  <span className="ops-billing-badge" data-kind={selected.billingKind}>
                    {billingLabel(selected.billingKind)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>{t.paidInvoices}</dt>
                <dd>{selected.paidInvoiceCount}</dd>
              </div>
              <div>
                <dt>{t.colUsage}</dt>
                <dd>{selected.usageToday.points}/{selected.dailyLimit}</dd>
              </div>
              <div>
                <dt>{t.colUsage7d}</dt>
                <dd>{selected.usage7d.points.toLocaleString(copy.locale)}</dd>
              </div>
              <div>
                <dt>{copy.billing.activeKeys}</dt>
                <dd>{selected.keys.filter((key) => !key.revokedAt).length}/{selected.maxKeys}</dd>
              </div>
              {selected.subscription ? (
                <>
                  <div>
                    <dt>{t.subStatus}</dt>
                    <dd>{selected.subscription.status}</dd>
                  </div>
                  <div>
                    <dt>{t.subRenews}</dt>
                    <dd dir="ltr">
                      {selected.subscription.currentPeriodEnd
                        ? new Date(selected.subscription.currentPeriodEnd).toLocaleDateString(copy.locale)
                        : "—"}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </section>

          {(selected.utmSource || selected.signupReferrer || selected.signupLandingPath) ? (
            <section className="ops-detail-section">
              <h4>{t.attributionTitle}</h4>
              <dl className="ops-customer-facts">
                <div className="ops-fact-wide">
                  <dt>UTM</dt>
                  <dd dir="ltr">
                    {[selected.utmSource, selected.utmMedium, selected.utmCampaign, selected.utmContent, selected.utmTerm]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </dd>
                </div>
                {selected.signupReferrer ? (
                  <div className="ops-fact-wide">
                    <dt>{t.referrer}</dt>
                    <dd dir="ltr" className="ops-break-all">{selected.signupReferrer}</dd>
                  </div>
                ) : null}
                {selected.signupLandingPath ? (
                  <div className="ops-fact-wide">
                    <dt>{t.landingPath}</dt>
                    <dd dir="ltr" className="ops-break-all">{selected.signupLandingPath}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {selected.keys.length > 0 ? (
            <section className="ops-detail-section">
              <h4>{copy.billing.activeKeys}</h4>
              <ul className="ops-customer-keys">
                {selected.keys.map((key) => (
                  <li key={key.id} dir="ltr">
                    {key.name} · {key.prefix}…{key.lastFour}
                    {key.revokedAt ? ` · ${t.revoked}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {selected.invoices.length > 0 ? (
            <section className="ops-detail-section">
              <h4>{t.invoicesTitle}</h4>
              <ul className="ops-customer-invoices">
                {selected.invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <button
                      type="button"
                      className="ops-invoice-pick"
                      data-status={invoice.status.toLowerCase()}
                      onClick={() => onSelectInvoice?.(invoice.id)}
                    >
                      {invoice.number} · {invoice.status} · {money(invoice.totalCents)}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
