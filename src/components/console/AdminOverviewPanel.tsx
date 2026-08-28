"use client";

import { useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { OpsBarChart, OpsCountUp, OpsDonutChart, OpsPanelSkeleton } from "@/components/console/ops/OpsCharts";
import { BrandLoader } from "@/components/media/BrandLoader";
import { TRAFFIC_CHANNEL_LABELS, type TrafficChannel } from "@/lib/attribution";

type OverviewPayload = {
  accounts: {
    total: number;
    active: number;
    byPlan: { FREE: number; PRO: number; ENTERPRISE: number };
    signups7d: number;
    signups30d: number;
  };
  revenue: {
    mrrUsd: number;
    revenue30dUsd: number;
    openInvoices: number;
    paidInvoices30d: number;
  };
  api: { requestsToday: number; requests7d: number };
  traffic: {
    pageViewsToday: number;
    pageViews7d: number;
    channels7d: Array<{ channel: string; views: number }>;
    topPaths7d: Array<{ path: string; views: number }>;
    utmSources7d: Array<{ source: string; views: number }>;
  };
  subscriptions: {
    activeMonthly: number;
    cancellingMonthly: number;
    oneTimePaid: number;
    renewedPaid: number;
    retentionRate: number;
    retentionCohort: number;
    retentionRetained: number;
    mostSelectedPlan: string;
    planMix: { FREE: number; PRO: number; ENTERPRISE: number };
    signupsByMonth: Array<{ month: string; count: number }>;
    paidInvoices30d: number;
  };
};

function money(usd: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(usd);
}

export function AdminOverviewPanel() {
  const { copy } = useConsoleCopy();
  const t = copy.opsOverview;
  const s = copy.opsSubscriptions;
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/console/admin/overview");
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || t.loadFailed);
        if (!cancelled) setData(payload);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t.loadFailed);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [t.loadFailed]);

  function channelLabel(channel: string) {
    const key = channel as TrafficChannel;
    return TRAFFIC_CHANNEL_LABELS[key]?.[copy.lang] || channel || "—";
  }

  if (loading) {
    return (
      <div className="ops-panel-enter" aria-busy="true">
        <OpsPanelSkeleton />
        <div className="ops-loading ops-loading-overlay">
          <BrandLoader size="sm" label={t.loading} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="console-gate-error" role="alert">{error || t.loadFailed}</p>;
  }

  const planSlices = [
    { label: t.free, value: data.subscriptions.planMix.FREE, color: "#94a3b8" },
    { label: t.pro, value: data.subscriptions.planMix.PRO, color: "#5ec8dc" },
    { label: t.enterprise, value: data.subscriptions.planMix.ENTERPRISE, color: "#0b1422" },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="ops-panel-enter">
      <section className="console-metric-grid ops-metric-grid" aria-label={t.metricsAria}>
        <article className="console-metric console-metric-primary ops-metric-animate">
          <span>{t.mrr}</span>
          <strong>{money(data.revenue.mrrUsd, copy.locale)}</strong>
          <small>{t.mrrHint}</small>
        </article>
        <article className="console-metric ops-metric-animate">
          <span>{s.retentionRate}</span>
          <strong>
            <OpsCountUp value={data.subscriptions.retentionRate} locale={copy.locale} suffix="%" />
          </strong>
          <small>{s.retentionHint(data.subscriptions.retentionRetained, data.subscriptions.retentionCohort)}</small>
        </article>
        <article className="console-metric ops-metric-animate">
          <span>{s.activeMonthly}</span>
          <strong><OpsCountUp value={data.subscriptions.activeMonthly} locale={copy.locale} /></strong>
          <small>{s.cancelling(data.subscriptions.cancellingMonthly)}</small>
        </article>
        <article className="console-metric ops-metric-animate">
          <span>{s.mostSelectedPlan}</span>
          <strong>{data.subscriptions.mostSelectedPlan}</strong>
          <small>{s.planAccounts(data.accounts.byPlan[data.subscriptions.mostSelectedPlan as keyof typeof data.accounts.byPlan] || 0)}</small>
        </article>
        <article className="console-metric ops-metric-animate">
          <span>{t.revenue30d}</span>
          <strong>{money(data.revenue.revenue30dUsd, copy.locale)}</strong>
          <small>{t.revenue30dHint}</small>
        </article>
        <article className="console-metric ops-metric-animate">
          <span>{t.accounts}</span>
          <strong><OpsCountUp value={data.accounts.total} locale={copy.locale} /></strong>
          <small>{t.signups7d}: {data.accounts.signups7d.toLocaleString(copy.locale)}</small>
        </article>
        <article className="console-metric ops-metric-animate">
          <span>{t.apiToday}</span>
          <strong><OpsCountUp value={data.api.requestsToday} locale={copy.locale} /></strong>
          <small>{t.api7d}: {data.api.requests7d.toLocaleString(copy.locale)}</small>
        </article>
        <article className="console-metric ops-metric-animate">
          <span>{t.pageViewsToday}</span>
          <strong><OpsCountUp value={data.traffic.pageViewsToday} locale={copy.locale} /></strong>
          <small>{t.pageViews7d}: {data.traffic.pageViews7d.toLocaleString(copy.locale)}</small>
        </article>
      </section>

      <div className="ops-split-grid ops-charts-grid">
        <section className="console-panel ops-chart-panel">
          <div className="console-panel-heading">
            <h2>{t.planMix}</h2>
          </div>
          <OpsDonutChart
            slices={planSlices.length ? planSlices : [{ label: t.free, value: 1, color: "#94a3b8" }]}
            locale={copy.locale}
            centerLabel={t.accounts}
            ariaLabel={t.planMix}
          />
        </section>

        <section className="console-panel ops-chart-panel">
          <div className="console-panel-heading">
            <h2>{s.billingTypes}</h2>
          </div>
          <OpsBarChart
            locale={copy.locale}
            ariaLabel={s.billingTypes}
            rows={[
              { label: s.monthlyRenewing, value: data.subscriptions.activeMonthly, tone: "cyan" },
              { label: s.renewed, value: data.subscriptions.renewedPaid, tone: "ink" },
              { label: s.oneTime, value: data.subscriptions.oneTimePaid, tone: "muted" },
            ]}
          />
        </section>
      </div>

      <div className="ops-split-grid">
        <section className="console-panel ops-chart-panel">
          <div className="console-panel-heading">
            <h2>{s.signupsTrend}</h2>
          </div>
          <OpsBarChart
            locale={copy.locale}
            ariaLabel={s.signupsTrend}
            rows={data.subscriptions.signupsByMonth.map((row) => ({
              label: row.month,
              value: row.count,
              tone: "cyan",
            }))}
          />
        </section>

        <section className="console-panel">
          <div className="console-panel-heading">
            <h2>{t.trafficChannels}</h2>
          </div>
          <ul className="ops-stat-list">
            {data.traffic.channels7d.length ? data.traffic.channels7d.map((row) => (
              <li key={row.channel}>
                <span>{channelLabel(row.channel)}</span>
                <strong>{t.views(row.views)}</strong>
              </li>
            )) : (
              <li><span>—</span><strong>0</strong></li>
            )}
          </ul>
        </section>
      </div>

      <div className="ops-split-grid">
        <section className="console-panel">
          <div className="console-panel-heading">
            <h2>{t.topPaths}</h2>
          </div>
          <ul className="ops-stat-list ops-stat-list-mono">
            {data.traffic.topPaths7d.map((row) => (
              <li key={row.path}>
                <span dir="ltr">{row.path}</span>
                <strong>{row.views.toLocaleString(copy.locale)}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="console-panel">
          <div className="console-panel-heading">
            <h2>{t.utmSources}</h2>
          </div>
          <ul className="ops-stat-list">
            {data.traffic.utmSources7d.length ? data.traffic.utmSources7d.map((row) => (
              <li key={row.source}>
                <span dir="ltr">{row.source}</span>
                <strong>{row.views.toLocaleString(copy.locale)}</strong>
              </li>
            )) : (
              <li><span>—</span><strong>0</strong></li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
