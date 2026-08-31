import { Category, Region } from "@prisma/client";
import { regionForCountry } from "../classify";

export type CountrySourceSeed = {
  code: string;
  name: string;
  url: string;
  homepageUrl: string;
  adapter: "rss";
  country: string;
  region: Region;
  defaultCategory: Category;
  qualityWeight: number;
  /** Feed language — Arabic pipeline sources use "ar". */
  sourceLocale?: "ar" | "en";
  /** "arabic" = separate collect job, no translation drain. */
  collectPipeline?: "main" | "arabic";
};

/** North Africa markets that already use MIDDLE_EAST on curated rows. */
const CATALOG_MIDDLE_EAST = new Set(["MA", "TN", "DZ"]);

export function publisherRegion(country: string): Region {
  if (country === "GLOBAL" || country === "EU") return Region.GLOBAL;
  if (CATALOG_MIDDLE_EAST.has(country)) return Region.MIDDLE_EAST;
  return regionForCountry(country, Region.GLOBAL);
}

export function countryRss(
  code: string,
  name: string,
  url: string,
  homepageUrl: string,
  country: string,
  region: Region,
  defaultCategory: Category,
  qualityWeight: number,
): CountrySourceSeed {
  return {
    code,
    name,
    url,
    homepageUrl,
    adapter: "rss",
    country,
    region,
    defaultCategory,
    qualityWeight,
  };
}

export function publisherRss(
  code: string,
  name: string,
  url: string,
  homepageUrl: string,
  country: string,
  defaultCategory: Category,
  qualityWeight: number,
): CountrySourceSeed {
  return countryRss(
    code,
    name,
    url,
    homepageUrl,
    country,
    publisherRegion(country),
    defaultCategory,
    qualityWeight,
  );
}

export type PublisherRow = readonly [
  code: string,
  name: string,
  url: string,
  homepageUrl: string,
  country: string,
  defaultCategory: Category,
  qualityWeight: number,
];

export function rowsToSources(rows: readonly PublisherRow[]): CountrySourceSeed[] {
  return rows.map(([code, name, url, homepageUrl, country, category, weight]) =>
    publisherRss(code, name, url, homepageUrl, country, category, weight),
  );
}

/** Native Arabic RSS publisher for the dedicated Arabic collect pipeline. */
export function arabicPublisherRss(
  code: string,
  name: string,
  url: string,
  homepageUrl: string,
  country: string,
  defaultCategory: Category,
  qualityWeight: number,
): CountrySourceSeed {
  return {
    ...publisherRss(code, name, url, homepageUrl, country, defaultCategory, qualityWeight),
    sourceLocale: "ar",
    collectPipeline: "arabic",
  };
}

/** Google News Arabic search feed for the dedicated Arabic collect pipeline. */
export function arabicGoogleNewsRss(
  code: string,
  name: string,
  query: string,
  homepageUrl: string,
  country: string,
  region: Region,
  defaultCategory: Category,
  qualityWeight: number,
  rssUrl: string,
): CountrySourceSeed {
  return {
    code,
    name,
    url: rssUrl,
    homepageUrl,
    adapter: "rss",
    country,
    region,
    defaultCategory,
    qualityWeight,
    sourceLocale: "ar",
    collectPipeline: "arabic",
  };
}
