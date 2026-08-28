import type { Icon } from "@phosphor-icons/react";
import {
  ClockCounterClockwise,
  GlobeStand,
  Ranking,
  Rss,
} from "@phosphor-icons/react/ssr";
import { landingCopy } from "@/lib/landing-translation";

type Metric = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
};

const metricIcons: Record<string, Icon> = {
  fresh: ClockCounterClockwise,
  feeds: Rss,
  brief: Ranking,
  countries: GlobeStand,
};

const sparklineColors: Record<string, string> = {
  fresh: "#5ec8dc",
  feeds: "#34d399",
  brief: "#f59e0b",
  countries: "#a78bfa",
};

function sparklinePoints(seed: number) {
  return Array.from({ length: 14 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.85) * 12;
    const drift = ((seed * (index + 3) * 13) % 28) - 14;
    const y = 28 - wave - drift * 0.35;
    return `${index === 0 ? "M" : "L"} ${index * 8} ${Math.max(6, Math.min(42, y))}`;
  }).join(" ");
}

function MetricSparkline({ id, seed }: { id: string; seed: number }) {
  const stroke = sparklineColors[id] ?? "#5ec8dc";
  const path = sparklinePoints(seed);

  return (
    <svg
      className="mkt-brief-metric-sparkline"
      viewBox="0 0 96 48"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path
        d={`${path} L 96 48 L 0 48 Z`}
        fill={stroke}
        fillOpacity="0.12"
        stroke="none"
      />
    </svg>
  );
}

export function BriefMetricsDashboard({
  lang,
  metrics,
}: {
  lang: "ar" | "en";
  metrics: Metric[];
}) {
  const copy = landingCopy(lang);

  return (
    <section
      className="mkt-brief-metrics"
      aria-label={lang === "ar" ? "مؤشرات التغطية" : "Coverage metrics"}
      dir={copy.dir}
      lang={copy.lang}
    >
      <ul className="mkt-brief-metrics__grid">
        {metrics.map((metric, index) => {
          const IconComponent = metricIcons[metric.id] ?? ClockCounterClockwise;
          const seed =
            typeof metric.value === "number"
              ? metric.value
              : Number.parseInt(String(metric.value).replace(/\D/g, ""), 10) || index + 1;

          return (
            <li key={metric.id} className="mkt-brief-metric" data-metric-id={metric.id}>
              <div className="mkt-brief-metric__icon" aria-hidden="true">
                <IconComponent size={20} weight="regular" />
              </div>
              <p className="mkt-brief-metric__label">{metric.label}</p>
              <p className="mkt-brief-metric__value">
                {typeof metric.value === "number"
                  ? metric.value.toLocaleString("en")
                  : metric.value}
              </p>
              <p className="mkt-brief-metric__detail">{metric.detail}</p>
              <MetricSparkline id={metric.id} seed={seed} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
