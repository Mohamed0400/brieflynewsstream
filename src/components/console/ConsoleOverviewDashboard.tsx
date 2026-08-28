"use client";

import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  Code,
  GlobeHemisphereWest,
  GridFour,
  Key,
  Lightning,
  Translate,
} from "@phosphor-icons/react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";

type Props = {
  countries: number;
  categories: number;
  activeKeys: number;
  maxKeys: number;
  dailyLimit: number;
  requestsUsed: number;
  languagesLabel: string;
};

export function ConsoleOverviewDashboard({
  countries,
  categories,
  activeKeys,
  maxKeys,
  dailyLimit,
  requestsUsed,
  languagesLabel,
}: Props) {
  const { copy, lang } = useConsoleCopy();
  const o = copy.overview;
  const dir = copy.dir;
  const RowArrow = dir === "rtl" ? CaretLeft : CaretRight;
  const usagePct = dailyLimit > 0 ? Math.min(100, (requestsUsed / dailyLimit) * 100) : 0;

  const metrics = [
    { label: o.countries, value: String(countries), Icon: GlobeHemisphereWest, word: false },
    { label: o.categories, value: String(categories), Icon: GridFour, word: false },
    { label: o.activeKeys, value: String(activeKeys), Icon: Key, word: false },
    { label: o.dailyLimit, value: String(dailyLimit), Icon: Lightning, word: false },
    { label: o.languages, value: languagesLabel, Icon: Translate, word: true },
  ];

  return (
    <>
      <header className="console-overview-heading">
        <h2>{o.accountOverviewTitle}</h2>
      </header>

      <section className="console-metric-grid console-overview-metrics" aria-label={o.metricsAria}>
        {metrics.map(({ label, value, Icon, word }) => (
          <article key={label} className="console-metric console-overview-metric">
            <Icon className="console-overview-metric-icon" size={22} weight="regular" aria-hidden="true" />
            <span>{label}</span>
            <strong className={word ? "console-word-metric" : undefined} dir={word ? "ltr" : undefined}>
              {value}
            </strong>
          </article>
        ))}
      </section>

      <div className="console-overview-grid console-overview-panels">
        <section className="console-panel console-usage-panel" aria-label={o.planAria}>
          <div className="console-panel-heading">
            <div>
              <h2>{o.requestsToday}</h2>
              <p>{o.usageHint}</p>
            </div>
          </div>
          <p className="console-usage-counter">
            <strong>{requestsUsed.toLocaleString(lang === "ar" ? "ar" : "en-US")}</strong>
            <span>
              {" / "}
              {dailyLimit.toLocaleString(lang === "ar" ? "ar" : "en-US")}
            </span>
          </p>
          <div className="console-usage-bar" aria-hidden="true">
            <span style={{ width: `${usagePct}%` }} />
          </div>
          <p className="console-help">{o.usageResetHint}</p>
        </section>

        <section className="console-panel console-quick-panel" aria-label={o.quickAccessTitle}>
          <div className="console-panel-heading">
            <div>
              <h2>{o.quickAccessTitle}</h2>
            </div>
          </div>
          <div className="console-quick-links">
            <Link href="/console/keys" className="console-quick-link">
              <RowArrow className="console-quick-link-arrow" size={18} weight="bold" aria-hidden="true" />
              <div className="console-quick-link-copy">
                <strong>{copy.nav.keys}</strong>
                <span>{o.quickAccessKeysHint}</span>
              </div>
              <Key className="console-quick-link-icon" size={22} weight="regular" aria-hidden="true" />
            </Link>
            <Link href="/console/docs/api" className="console-quick-link">
              <RowArrow className="console-quick-link-arrow" size={18} weight="bold" aria-hidden="true" />
              <div className="console-quick-link-copy">
                <strong>{copy.nav.apiDocs}</strong>
                <span>{o.quickAccessApiHint}</span>
              </div>
              <Code className="console-quick-link-icon" size={22} weight="regular" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
