import { ARABIC_NATIVE_PUBLISHERS } from "./sources/arabic-publishers";
import { generatedArabicGoogleSources } from "./sources/arabic-google-sources";

/** All sources for the dedicated Arabic collect pipeline. */
export function arabicLiveSources() {
  return [...ARABIC_NATIVE_PUBLISHERS, ...generatedArabicGoogleSources()];
}

export function isArabicCollectEnabled() {
  const flag = process.env.ARABIC_COLLECT_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  return flag === "true" || flag === "1" || flag === "on" || Boolean(process.env.ARABIC_COLLECT_FORCE);
}

/** Count feeds by desk country and category (for ops audits). */
export function arabicSourceCatalogStats() {
  const sources = arabicLiveSources();
  const byCountry = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const source of sources) {
    byCountry.set(source.country, (byCountry.get(source.country) ?? 0) + 1);
    byCategory.set(source.defaultCategory, (byCategory.get(source.defaultCategory) ?? 0) + 1);
  }
  return {
    total: sources.length,
    native: ARABIC_NATIVE_PUBLISHERS.length,
    googleNews: sources.length - ARABIC_NATIVE_PUBLISHERS.length,
    byCountry: Object.fromEntries([...byCountry.entries()].sort((a, b) => b[1] - a[1])),
    byCategory: Object.fromEntries([...byCategory.entries()].sort((a, b) => b[1] - a[1])),
  };
}
