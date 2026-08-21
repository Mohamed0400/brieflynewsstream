import { Region } from "@prisma/client";
import { regionForCountry } from "@/lib/classify";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { REGION_META } from "@/lib/market";

const SAMPLE_CODES: Record<(typeof REGION_META)[number]["code"], string[]> = {
  middle_east: ["SA", "AE", "EG", "QA"],
  america: ["US", "CA", "MX", "BR"],
  global: ["GB", "JP", "SG", "AU"],
};

export function marketingRegionPins() {
  return REGION_META.map((region) => {
    const codes = COUNTRY_CATALOG.filter(
      (country) => regionForCountry(country.code, Region.GLOBAL) === region.value,
    ).map((country) => country.code);
    const samples = SAMPLE_CODES[region.code].filter((code) => codes.includes(code));
    return {
      code: region.code,
      label: region.label,
      labelAr: region.labelAr,
      samples,
      count: codes.length,
      more: Math.max(0, codes.length - samples.length),
    };
  });
}
