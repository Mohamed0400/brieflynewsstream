"use client";

import { useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { OpsPanelSkeleton } from "@/components/console/ops/OpsCharts";
import { BrandLoader } from "@/components/media/BrandLoader";
import { TRAFFIC_CHANNEL_LABELS, type TrafficChannel } from "@/lib/attribution";

type AnalyticsPayload = {
  days: number;
  pageViews: {
    channels: Array<{ channel: string; views: number }>;
    utmSources: Array<{ source: string; views: number }>;
    utmMediums: Array<{ medium: string; views: number }>;
    topPaths: Array<{ path: string; views: number }>;
    daily: Array<{ day: string; views: number }>;
  };
  signups: {
    byChannel: Array<{ channel: string; count: number }>;
  };
};

export function AdminAnalyticsPanel() {
  const { copy } = useConsoleCopy();
  const t = copy.opsAnalytics;
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/console/admin/analytics?days=${days}`);
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
  }, [days, t.loadFailed]);

  function channelLabel(channel: string) {
    const key = channel as TrafficChannel;
    return TRAFFIC_CHANNEL_LABELS[key]?.[copy.lang] || channel || "—";
  }

  return (
    <section className="console-panel" aria-labelledby="ops-analytics-title">
      <div className="console-panel-heading">
        <div>
          <h2 id="ops-analytics-title">{t.title}</h2>
          <p>{t.hint}</p>
        </div>
        <label className="ops-days-select">
          <span className="visually-hidden">{t.days(days)}</span>
          <select
            className="console-input"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>{t.days(7)}</option>
            <option value={14}>{t.days(14)}</option>
            <option value={30}>{t.days(30)}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="ops-panel-enter" aria-busy="true">
          <OpsPanelSkeleton rows={4} />
          <div className="ops-loading ops-loading-overlay">
            <BrandLoader size="sm" label={t.pageViews} />
          </div>
        </div>
      ) : error || !data ? (
        <p className="console-gate-error" role="alert">{error || t.loadFailed}</p>
      ) : (
        <div className="ops-analytics-grid">
          <StatBlock title={t.channels} rows={data.pageViews.channels.map((r) => [channelLabel(r.channel), r.views])} locale={copy.locale} />
          <StatBlock title={t.utmSources} rows={data.pageViews.utmSources.map((r) => [r.source || "—", r.views])} locale={copy.locale} ltr />
          <StatBlock title={t.utmMediums} rows={data.pageViews.utmMediums.map((r) => [r.medium || "—", r.views])} locale={copy.locale} ltr />
          <StatBlock title={t.topPaths} rows={data.pageViews.topPaths.map((r) => [r.path, r.views])} locale={copy.locale} ltr />
          <StatBlock title={t.signupChannels} rows={data.signups.byChannel.map((r) => [channelLabel(r.channel), r.count])} locale={copy.locale} />
          <StatBlock title={t.pageViews} rows={data.pageViews.daily.map((r) => [r.day, r.views])} locale={copy.locale} ltr />
        </div>
      )}
    </section>
  );
}

function StatBlock({
  title,
  rows,
  locale,
  ltr = false,
}: {
  title: string;
  rows: Array<[string, number]>;
  locale: string;
  ltr?: boolean;
}) {
  return (
    <div className="console-panel ops-analytics-block">
      <h3>{title}</h3>
      <ul className="ops-stat-list">
        {rows.length ? rows.map(([label, value]) => (
          <li key={`${title}-${label}`}>
            <span dir={ltr ? "ltr" : undefined}>{label}</span>
            <strong>{value.toLocaleString(locale)}</strong>
          </li>
        )) : (
          <li><span>—</span><strong>0</strong></li>
        )}
      </ul>
    </div>
  );
}
