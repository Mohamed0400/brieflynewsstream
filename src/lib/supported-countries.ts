import { COUNTRY_CATALOG, countryRecord } from "@/lib/countries";
import { COUNTRY_SOURCES } from "@/lib/country-sources";

export const EXTRA_MARKET_CODES = ["EU", "GLOBAL"] as const;

export const ARABIC_COUNTRY_NAMES: Record<string, string> = {
  ...Object.fromEntries(COUNTRY_CATALOG.map((item) => [item.code, item.nameAr])),
  EU: "الاتحاد الأوروبي",
  GLOBAL: "عالمي",
};

const EXTRA_ENGLISH_NAMES: Record<string, string> = {
  EU: "European Union",
  GLOBAL: "Global",
};

const EXTRA_FLAGS: Record<string, string> = {
  EU: "🇪🇺",
  GLOBAL: "🌐",
};

export function supportedCountryCodes(extra: string[] = []) {
  const codes = new Set<string>();
  for (const item of COUNTRY_CATALOG) codes.add(item.code);
  for (const code of EXTRA_MARKET_CODES) codes.add(code);
  for (const source of COUNTRY_SOURCES) codes.add(source.country);
  for (const code of extra) {
    const normalized = code.trim().toUpperCase();
    if (normalized) codes.add(normalized);
  }
  return [...codes].sort((a, b) => a.localeCompare(b));
}

export function countryDisplayName(code: string, lang: "ar" | "en") {
  const record = countryRecord(code);
  if (lang === "ar") {
    return record?.nameAr || ARABIC_COUNTRY_NAMES[code] || EXTRA_ENGLISH_NAMES[code] || code;
  }
  return record?.country || EXTRA_ENGLISH_NAMES[code] || code;
}

export function localizedCountryLabel(code: string, lang: "ar" | "en") {
  const flag = countryFlag(code);
  const name = countryDisplayName(code, lang);
  return flag ? `${flag} ${name}` : name;
}

export function countryFlag(code: string) {
  return countryRecord(code)?.flag || EXTRA_FLAGS[code] || null;
}
