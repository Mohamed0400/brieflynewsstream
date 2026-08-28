"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type CountryChip = {
  code: string;
  label: string;
  name: string;
  href: string;
  live: boolean;
  active: boolean;
};

export type CountryChipGroup = {
  key: string;
  label: string;
  items: CountryChip[];
};

export function SupportedCountriesScreen({
  title,
  liveLabel,
  catalogLabel,
  groups,
  dir,
  lang,
  searchPlaceholder,
  searchLabel,
  emptyLabel,
  groupFilterLabel,
  groupFilterAll,
}: {
  title: string;
  liveLabel: string;
  catalogLabel: string;
  groups: CountryChipGroup[];
  dir: "ltr" | "rtl";
  lang: "ar" | "en";
  searchPlaceholder: string;
  searchLabel: string;
  emptyLabel: string;
  groupFilterLabel: string;
  groupFilterAll: string;
}) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [glitchIndex, setGlitchIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sourceGroups =
      selectedGroup === "all"
        ? groups
        : groups.filter((group) => group.key === selectedGroup);
    const items = sourceGroups.flatMap((group) => group.items);
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        item.label.toLowerCase().includes(needle),
    );
  }, [groups, query, selectedGroup]);

  useEffect(() => {
    if (reduceMotion || visibleItems.length === 0) return;
    const id = window.setInterval(() => {
      setGlitchIndex((index) => (index + 1) % visibleItems.length);
    }, 1280);
    return () => window.clearInterval(id);
  }, [reduceMotion, visibleItems.length]);

  return (
    <section
      className="homepage-country-screen"
      aria-labelledby="homepage-countries-title"
      dir={dir}
      lang={lang}
    >
      <div className="homepage-country-head">
        <h2 id="homepage-countries-title">{title}</h2>
      </div>
      <div className="homepage-country-toolbar">
        <label className="homepage-country-search" htmlFor="homepage-country-search">
          <span className="sr-only">{searchLabel}</span>
          <input
            id="homepage-country-search"
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={searchLabel}
          />
        </label>
        <label className="homepage-country-group-filter" htmlFor="homepage-country-group">
          <span>{groupFilterLabel}</span>
          <select
            id="homepage-country-group"
            value={selectedGroup}
            onChange={(event) => setSelectedGroup(event.target.value)}
            aria-label={groupFilterLabel}
          >
            <option value="all">{groupFilterAll}</option>
            {groups.map((group) => (
              <option key={group.key} value={group.key}>
                {group.label} ({group.items.length})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="homepage-country-board">
        <div className="homepage-country-scan" aria-hidden="true" />
        {visibleItems.length === 0 ? (
          <p className="homepage-country-empty">{emptyLabel}</p>
        ) : (
          <div
            className="mkt-hscroll-strip homepage-country-scroll"
            aria-label={title}
          >
            <ul className="mkt-hscroll-strip__track homepage-country-chips">
              {visibleItems.map((item, index) => (
                <li key={item.code} style={{ "--i": index } as CSSProperties}>
                  <Link
                    href={item.href}
                    className={[
                      "homepage-country-chip",
                      item.live ? "is-live" : "",
                      item.active ? "is-active" : "",
                      !reduceMotion && index === glitchIndex ? "is-glitching" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    scroll={false}
                    title={item.live ? liveLabel : catalogLabel}
                    aria-current={item.active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
