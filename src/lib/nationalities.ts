import { COUNTRY_CATALOG, type CountryRecord } from "./countries";

export type NationalityOption = CountryRecord;

/**
 * Practical audience options for Kuwait-facing content.
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

export function optionForCode(code: string) {
  return NATIONALITY_OPTIONS.find((option) => option.code === code.toUpperCase());
}
