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

/**
 * UI-only region grouping for the country picker so the list stays browseable as
 * it scales. Independent of the Prisma `Region` enum (which only has three values)
 * — this maps every catalog code plus the EU/GLOBAL extras to a browse bucket.
 */
export type CountryRegionKey =
  | "middle_east"
  | "africa"
  | "europe"
  | "americas"
  | "asia_pacific"
  | "global";

export const REGION_GROUP_META: ReadonlyArray<{
  key: CountryRegionKey;
  label: string;
  labelAr: string;
}> = [
  { key: "middle_east", label: "Middle East", labelAr: "الشرق الأوسط" },
  { key: "africa", label: "Africa", labelAr: "أفريقيا" },
  { key: "europe", label: "Europe", labelAr: "أوروبا" },
  { key: "americas", label: "Americas", labelAr: "الأمريكتان" },
  { key: "asia_pacific", label: "Asia-Pacific", labelAr: "آسيا والمحيط الهادئ" },
  { key: "global", label: "Global & other", labelAr: "عالمي وأخرى" },
];

const REGION_MEMBERS: Record<CountryRegionKey, string[]> = {
  middle_east: [
    "KW", "SA", "AE", "QA", "BH", "OM",
    "EG", "JO", "LB", "SY", "PS", "IQ", "IR", "YE", "TR",
    "IL",
  ],
  africa: [
    "MA", "TN", "DZ", "LY", "SD", "MR", "DJ", "SO", "KM", "NG", "KE", "ET",
    "GH", "ZA", "AO", "CI", "TZ", "UG", "SN", "CM", "RW", "ZM", "MU",
  ],
  europe: [
    "GB", "DE", "FR", "IT", "ES", "NL", "CH", "BE", "AT", "SE", "NO", "DK",
    "PL", "UA", "RU", "PT", "IE", "FI", "GR", "CZ", "RO", "HU", "SK", "HR",
    "RS", "BG", "IS", "EU",
  ],
  americas: ["US", "CA", "MX", "BR", "AR", "CL", "PY", "CO", "PE", "UY", "EC", "VE", "BO", "CR", "PA"],
  asia_pacific: [
    "IN", "BD", "PH", "LK", "PK", "NP", "ID", "AF", "KZ", "CN", "JP", "KR",
    "HK", "TW", "MY", "SG", "TH", "VN", "AU", "NZ",
  ],
  global: ["GLOBAL"],
};

const REGION_BY_CODE = new Map<string, CountryRegionKey>();
for (const meta of REGION_GROUP_META) {
  for (const code of REGION_MEMBERS[meta.key]) REGION_BY_CODE.set(code, meta.key);
}

const REGION_ORDER_INDEX = new Map<string, number>();
for (const meta of REGION_GROUP_META) {
  REGION_MEMBERS[meta.key].forEach((code, index) => {
    REGION_ORDER_INDEX.set(`${meta.key}:${code}`, index);
  });
}

function sortRegionItems(items: CountryPickerItem[], regionKey: CountryRegionKey, lang: "ar" | "en") {
  const collator = lang === "ar" ? "ar" : "en";
  return [...items].sort((a, b) => {
    const aIndex = REGION_ORDER_INDEX.get(`${regionKey}:${a.code}`);
    const bIndex = REGION_ORDER_INDEX.get(`${regionKey}:${b.code}`);
    if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
    if (aIndex !== undefined) return -1;
    if (bIndex !== undefined) return 1;
    return a.name.localeCompare(b.name, collator);
  });
}

export function regionGroupForCode(code: string): CountryRegionKey {
  return REGION_BY_CODE.get(code.trim().toUpperCase()) ?? "global";
}

export function regionEditorialRank(regionKey: CountryRegionKey, code: string) {
  return REGION_ORDER_INDEX.get(`${regionKey}:${code.trim().toUpperCase()}`) ?? Number.MAX_SAFE_INTEGER;
}

export function regionGroupLabel(key: CountryRegionKey, lang: "ar" | "en") {
  const meta = REGION_GROUP_META.find((item) => item.key === key);
  if (!meta) return key;
  return lang === "ar" ? meta.labelAr : meta.label;
}

export type CountryPickerItem = {
  code: string;
  name: string;
  label: string;
};

export type CountryRegionGroup = {
  key: CountryRegionKey;
  label: string;
  items: CountryPickerItem[];
};

/**
 * Groups supported country codes into browse buckets, each sorted by the
 * editorial region order (Gulf-first in Middle East) with alphabetical tail
 * for codes outside the curated list. Empty regions are dropped.
 */
export function groupCountryCodesByRegion(
  codes: string[],
  lang: "ar" | "en",
): CountryRegionGroup[] {
  const buckets = new Map<CountryRegionKey, CountryPickerItem[]>();
  for (const code of codes) {
    const key = regionGroupForCode(code);
    const item: CountryPickerItem = {
      code,
      name: countryDisplayName(code, lang),
      label: localizedCountryLabel(code, lang),
    };
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }
  return REGION_GROUP_META.flatMap((meta) => {
    const items = buckets.get(meta.key);
    if (!items || items.length === 0) return [];
    return [{
      key: meta.key,
      label: regionGroupLabel(meta.key, lang),
      items: sortRegionItems(items, meta.key, lang),
    }];
  });
}
