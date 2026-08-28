import { COUNTRY_CATALOG, type CountryRecord } from "./countries";
import {
  countryDisplayName,
  regionEditorialRank,
  regionGroupForCode,
  regionGroupPriority,
} from "./supported-countries";

export type NationalityOption = CountryRecord;

/**
 * Practical audience options for community briefings.
 * Ordering is editorial, not an asserted demographic ranking.
 * Article-country coverage lives in COUNTRY_CATALOG, not this list.
 */
export const NATIONALITY_OPTIONS: NationalityOption[] = COUNTRY_CATALOG.filter(
  (item) => item.community,
);

export const NATIONALITY_GROUPS = [
  {
    code: "AFRICA",
    slug: "africa",
    label: "African communities",
    type: "region",
    countryCodes: ["EG", "ET", "SD", "NG", "KE", "MA", "TN", "DZ"],
  },
] as const;

const lookup = new Map<string, string[]>();
for (const option of NATIONALITY_OPTIONS) {
  for (const key of [
    option.code,
    option.slug,
    option.country,
    option.nationality,
    option.nameAr,
    option.nationalityAr,
    ...option.aliases,
  ]) {
    lookup.set(key.toLowerCase(), [option.code]);
  }
}
for (const group of NATIONALITY_GROUPS) {
  lookup.set(group.code.toLowerCase(), [...group.countryCodes]);
  lookup.set(group.slug.toLowerCase(), [...group.countryCodes]);
  lookup.set(group.label.toLowerCase(), [...group.countryCodes]);
}

export function expandNationalityInputs(values: string[]) {
  return [...new Set(values.flatMap((value) => lookup.get(value.trim().toLowerCase()) ?? []))];
}

export function audienceToken(code: string) {
  return `|${code.toUpperCase()}|`;
}

export function audienceValue(codes: string[]) {
  return [...new Set(codes.map((code) => code.toUpperCase()))]
    .map(audienceToken)
    .join("");
}

export function audienceCodesFromValue(value: string) {
  return [...value.matchAll(/\|([A-Z]{2})\|/g)].map((match) => match[1]);
}

/** Audience chips follow the same Gulf-first editorial order as the country picker. */
export function sortAudienceCodesByEditorialOrder(codes: string[]) {
  return [...new Set(codes.map((code) => code.toUpperCase()))].sort((a, b) => {
    const leftGroup = regionGroupForCode(a);
    const rightGroup = regionGroupForCode(b);
    const leftTier = regionGroupPriority(leftGroup);
    const rightTier = regionGroupPriority(rightGroup);
    if (leftTier !== rightTier) return leftTier - rightTier;
    const leftRank = regionEditorialRank(leftGroup, a);
    const rightRank = regionEditorialRank(rightGroup, b);
    if (leftRank !== rightRank) return leftRank - rightRank;
    return a.localeCompare(b);
  });
}

export function optionForCode(code: string) {
  return NATIONALITY_OPTIONS.find((option) => option.code === code.toUpperCase());
}

/** GCC states where expat community briefings are a primary use case. */
const GCC_HOST_CODES = new Set(["KW", "SA", "AE", "QA", "BH", "OM"]);

/** Large expatriate communities commonly covered in Gulf host markets. */
const GCC_EXPAT_CODES = [
  "IN", "PK", "BD", "PH", "EG", "SY", "LK", "NP", "JO", "YE", "ET", "LB",
  "SD", "ID", "AF", "PS", "IQ", "IR", "NG", "KE", "MA", "TN", "DZ", "CN", "TR",
] as const;

const EUROPE_EXPAT_CODES = [
  "TR", "PL", "RO", "UA", "RU", "SY", "IQ", "MA", "TN", "DZ", "IN", "PK",
  "PH", "EG", "BD", "NG", "ET", "CN", "US", "BR",
] as const;

const AMERICAS_EXPAT_CODES = [
  "MX", "CN", "IN", "PH", "VN", "KR", "NG", "ET", "EG", "PK", "BD", "BR",
  "CO", "GT", "HN", "SV", "DO", "CU", "JM", "HT",
] as const;

const ASIA_PACIFIC_EXPAT_CODES = [
  "CN", "IN", "PH", "BD", "PK", "NP", "ID", "MY", "VN", "KR", "JP", "LK",
  "MM", "TH", "SG", "AU", "NZ", "GB", "US",
] as const;

const AFRICA_EXPAT_CODES = [
  "NG", "KE", "ET", "EG", "GH", "ZA", "MA", "TN", "DZ", "SN", "CM", "UG",
  "RW", "IN", "LB", "SY", "FR", "GB", "US", "CN",
] as const;

function expatCodesForHostRegion(hostCode: string) {
  const host = hostCode.toUpperCase();
  if (GCC_HOST_CODES.has(host)) {
    return GCC_EXPAT_CODES.filter((code) => code !== host);
  }
  const region = regionGroupForCode(host);
  if (region === "europe") {
    return EUROPE_EXPAT_CODES.filter((code) => code !== host);
  }
  if (region === "americas") {
    return AMERICAS_EXPAT_CODES.filter((code) => code !== host);
  }
  if (region === "asia_pacific") {
    return ASIA_PACIFIC_EXPAT_CODES.filter((code) => code !== host);
  }
  if (region === "africa") {
    return AFRICA_EXPAT_CODES.filter((code) => code !== host);
  }
  return NATIONALITY_OPTIONS.map((option) => option.code).filter((code) => code !== host);
}

/** ISO audience codes relevant to expatriates in a host country, or null for the full list. */
export function expatNationalityCodesForHost(hostCode?: string | null) {
  const host = hostCode?.trim().toUpperCase();
  if (!host) return null;
  return expatCodesForHostRegion(host);
}

export function nationalityOptionsForHost(hostCode?: string | null) {
  const codes = expatNationalityCodesForHost(hostCode);
  if (!codes) return NATIONALITY_OPTIONS;
  const allowed = new Set(codes);
  return NATIONALITY_OPTIONS.filter((option) => allowed.has(option.code));
}

export function nationalityGroupsForHost(hostCode?: string | null) {
  const allowed = new Set(nationalityOptionsForHost(hostCode).map((option) => option.code));
  return NATIONALITY_GROUPS
    .map((group) => ({
      ...group,
      countryCodes: group.countryCodes.filter((code) => allowed.has(code)),
    }))
    .filter((group) => group.countryCodes.length > 0);
}

export function isNationalityAllowedForHost(hostCode: string | null | undefined, nationalityCode: string) {
  if (!nationalityCode) return true;
  const codes = expatNationalityCodesForHost(hostCode);
  if (!codes) return true;
  return codes.includes(nationalityCode.toUpperCase());
}

export function nationalityAudienceLabel(option: CountryRecord, lang: "ar" | "en") {
  return lang === "ar" ? option.nationalityAr : option.nationality;
}

export function hostCountryBriefingLabel(hostCode: string, lang: "ar" | "en") {
  return countryDisplayName(hostCode, lang);
}
