"use client";

import { useEffect, useMemo, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { BrandLoader } from "@/components/media/BrandLoader";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { PLAN_DEFINITIONS } from "@/lib/plans";

type Customer = {
  id: string;
  email: string;
  role: string;
  status: string;
  plan: keyof typeof PLAN_DEFINITIONS;
  country: string;
  address: string;
  mobilePhone: string;
  createdAt: string;
  dailyLimit: number;
  maxKeys: number;
  usageToday: { requests: number; points: number };
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

function countryLabel(code: string, lang: "ar" | "en") {
  const row = COUNTRY_CATALOG.find((item) => item.code === code);
  if (!row) return code || "—";
  return lang === "ar" ? row.nameAr : row.country;
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AdminCustomersPanel({
  onSelectEmail,
}: {
  onSelectEmail?: (email: string) => void;
}) {
  const { copy } = useConsoleCopy();
  const t = copy.customers;
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
  }, [t.loadFailed]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => {
      return [item.email, item.country, item.mobilePhone, item.address, item.plan, item.status]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query]);

  const selected = filtered.find((item) => item.id === selectedId) || null;

  return (
    <section className="console-panel ops-customers" aria-labelledby="ops-customers-title">
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
        <div className="ops-customers-status">
          <BrandLoader size="sm" />
          <p>{t.loading}</p>
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
                <th>{t.colUsage}</th>
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
                    onSelectEmail?.(item.email);
                  }}
                >
                  <td>
                    <strong>{item.email}</strong>
                    {item.role === "SUPER_ADMIN" ? <span className="ops-pill">{t.staff}</span> : null}
                  </td>
                  <td>{countryLabel(item.country, copy.lang)}</td>
                  <td dir="ltr">{item.mobilePhone || "—"}</td>
                  <td>{item.plan}</td>
                  <td>{item.usageToday.points}/{item.dailyLimit}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString(copy.lang === "ar" ? "ar" : "en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <article className="ops-customer-detail" aria-label={selected.email}>
          <h3>{selected.email}</h3>
          <dl className="ops-customer-facts">
            <div>
              <dt>{t.colCountry}</dt>
              <dd>{countryLabel(selected.country, copy.lang)}</dd>
            </div>
            <div>
              <dt>{t.colMobile}</dt>
              <dd dir="ltr">{selected.mobilePhone || "—"}</dd>
            </div>
            <div>
              <dt>{t.colPlan}</dt>
              <dd>{selected.plan}</dd>
            </div>
            <div>
              <dt>{t.colUsage}</dt>
              <dd>{selected.usageToday.points}/{selected.dailyLimit}</dd>
            </div>
            <div>
              <dt>{copy.billing.activeKeys}</dt>
              <dd>{selected.keys.filter((key) => !key.revokedAt).length}/{selected.maxKeys}</dd>
            </div>
            <div>
              <dt>{t.colStatus}</dt>
              <dd>{selected.status}</dd>
            </div>
          </dl>
          <p className="ops-customer-address">{selected.address || t.noAddress}</p>
          {selected.keys.length > 0 ? (
            <ul className="ops-customer-keys">
              {selected.keys.map((key) => (
                <li key={key.id}>
                  {key.name} · {key.prefix}…{key.lastFour}
                  {key.revokedAt ? ` · ${t.revoked}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {selected.invoices.length > 0 ? (
            <ul className="ops-customer-invoices">
              {selected.invoices.map((invoice) => (
                <li key={invoice.id}>
                  {invoice.number} · {invoice.status} · {money(invoice.totalCents)}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
