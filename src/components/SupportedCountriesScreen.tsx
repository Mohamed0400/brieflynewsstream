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
}) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [glitchIndex, setGlitchIndex] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups.flatMap((group) => {
      const items = group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(needle) ||
          item.code.toLowerCase().includes(needle) ||
          item.label.toLowerCase().includes(needle),
      );
      return items.length ? [{ ...group, items }] : [];
    });
  }, [groups, query]);

  const totalVisible = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.items.length, 0),
    [filteredGroups],
  );

  useEffect(() => {
    if (reduceMotion || totalVisible === 0) return;
    const id = window.setInterval(() => {
      setGlitchIndex((index) => (index + 1) % totalVisible);
    }, 1280);
    return () => window.clearInterval(id);
  }, [reduceMotion, totalVisible]);

  let flatIndex = -1;

  return (
    <section
      className="homepage-country-screen"
      aria-labelledby="homepage-countries-title"
      dir={dir}
      lang={lang}
    >
      <div className="homepage-country-head">
        <h2 id="homepage-countries-title">{title}</h2>
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
      </div>
      <div className="homepage-country-board">
        <div className="homepage-country-scan" aria-hidden="true" />
        {totalVisible === 0 ? (
          <p className="homepage-country-empty">{emptyLabel}</p>
        ) : (
          filteredGroups.map((group) => (
            <div className="homepage-country-group" key={group.key}>
              <h3 className="homepage-country-group-title">
                {group.label}
                <span className="homepage-country-group-count">{group.items.length}</span>
              </h3>
              <ul>
                {group.items.map((item) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  return (
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
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
