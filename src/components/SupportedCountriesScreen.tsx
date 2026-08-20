"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

type CountryItem = {
  code: string;
  label: string;
  href: string;
  live: boolean;
  active: boolean;
};

export function SupportedCountriesScreen({
  title,
  liveLabel,
  catalogLabel,
  countries,
  dir,
  lang,
}: {
  title: string;
  liveLabel: string;
  catalogLabel: string;
  countries: CountryItem[];
  dir: "ltr" | "rtl";
  lang: "ar" | "en";
}) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [glitchIndex, setGlitchIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || countries.length === 0) return;
    const id = window.setInterval(() => {
      setGlitchIndex((index) => (index + 1) % countries.length);
    }, 1280);
    return () => window.clearInterval(id);
  }, [reduceMotion, countries.length]);

  return (
    <section
      className="homepage-country-screen"
      aria-labelledby="homepage-countries-title"
      dir={dir}
      lang={lang}
    >
      <h2 id="homepage-countries-title">{title}</h2>
      <div className="homepage-country-board">
        <div className="homepage-country-scan" aria-hidden="true" />
        <ul>
          {countries.map((item, index) => (
            <li key={item.code} style={{ "--i": index } as CSSProperties}>
              <Link
                href={item.href}
                className={[
                  "homepage-country-chip",
                  item.live ? "is-live" : "",
                  item.active ? "is-active" : "",
                  !reduceMotion && index === glitchIndex ? "is-glitching" : "",
                ].filter(Boolean).join(" ")}
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
    </section>
  );
}
