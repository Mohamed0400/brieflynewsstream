"use client";

import { useEffect, useRef, useState } from "react";

export function OpsCountUp({
  value,
  locale,
  duration = 900,
  prefix = "",
  suffix = "",
}: {
  value: number;
  locale: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return (
    <span className="ops-count-up">
      {prefix}
      {display.toLocaleString(locale)}
      {suffix}
    </span>
  );
}

type BarRow = { label: string; value: number; tone?: string };

export function OpsBarChart({
  rows,
  locale,
  ariaLabel,
}: {
  rows: BarRow[];
  locale: string;
  ariaLabel: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [rows]);

  return (
    <div className="ops-bar-chart" role="img" aria-label={ariaLabel}>
      <ul className="ops-bar-chart-list">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="ops-bar-chart-meta">
              <span>{row.label}</span>
              <strong>{row.value.toLocaleString(locale)}</strong>
            </div>
            <div className="ops-bar-chart-track">
              <span
                className="ops-bar-chart-fill"
                data-tone={row.tone || "default"}
                style={{ width: ready ? `${(row.value / max) * 100}%` : "0%" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Slice = { label: string; value: number; color: string };

export function OpsDonutChart({
  slices,
  locale,
  centerLabel,
  ariaLabel,
}: {
  slices: Slice[];
  locale: string;
  centerLabel: string;
  ariaLabel: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const [ready, setReady] = useState(false);
  let offset = 0;

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [slices]);

  const gradient = slices
    .map((slice) => {
      const start = (offset / total) * 100;
      offset += slice.value;
      const end = (offset / total) * 100;
      return `${slice.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="ops-donut-chart" role="img" aria-label={ariaLabel}>
      <div
        className="ops-donut-ring"
        data-ready={ready ? "true" : "false"}
        style={{ background: total ? `conic-gradient(${gradient})` : "var(--console-surface-strong)" }}
      >
        <div className="ops-donut-hole">
          <strong>{centerLabel}</strong>
          <span>{total.toLocaleString(locale)}</span>
        </div>
      </div>
      <ul className="ops-donut-legend">
        {slices.map((slice) => (
          <li key={slice.label}>
            <span className="ops-donut-swatch" style={{ background: slice.color }} />
            <span>{slice.label}</span>
            <strong>{slice.value.toLocaleString(locale)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OpsPanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="ops-skeleton" aria-hidden="true">
      <div className="ops-skeleton-metrics">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="ops-skeleton-block ops-skeleton-metric" />
        ))}
      </div>
      <div className="ops-skeleton-grid">
        <div className="ops-skeleton-block ops-skeleton-panel" />
        <div className="ops-skeleton-block ops-skeleton-panel" />
      </div>
      <div className="ops-skeleton-block ops-skeleton-table" style={{ height: `${rows * 2.4}rem` }} />
    </div>
  );
}
