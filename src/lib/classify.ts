import { Category, Region } from "@prisma/client";
import { COUNTRY_CATALOG } from "./countries";

const TERMS: Record<Category, string[]> = {
  GOLD: ["gold", "silver", "bullion", "precious metal", "xau", "jewellery", "jewelry", "central bank buying"],
  FINANCE: ["stock", "share", "bond", "yield", "dollar", "currency", "forex", "exchange rate", "equity", "bank", "investor", "fund", "wall street", "market"],
  ECONOMICS: ["inflation", "interest rate", "central bank", "federal reserve", "fed", "ecb", "monetary", "gdp", "economy", "economic", "jobs", "employment", "tariff", "recession", "cpi"],
  OIL: ["oil", "crude", "brent", "opec", "energy price", "petroleum", "lng"],
  ME_ECONOMY: ["kuwait economy", "gcc", "gulf economy", "kuwait finance", "saudi economy", "uae economy", "kuwait stock", "boursa kuwait"],
  COMMODITIES: ["commodity", "copper", "platinum", "palladium", "wheat", "natural gas", "mining"],
  MARKETS: ["trade", "business", "price", "fiscal", "debt", "investment", "growth"],
};

const OFF_TOPIC = [
  "football", "soccer", "cricket", "celebrity", "movie", "film review",
  "fashion", "recipe", "murder", "crime", "gaming", "travel guide",
  "brand ambassador", "real estate development", "luxury property",
  "vodka", "head of research",
];

const SPECIAL_COUNTRY_TERMS: Record<string, string[]> = {
  KW: ["cbk", "boursa"],
  SA: ["riyadh", "sama"],
  US: ["wall street", "federal reserve", "fed"],
  GB: ["bank of england"],
  CN: ["beijing", "pboc"],
};

const COUNTRIES: Array<[string, string[]]> = [
  ...COUNTRY_CATALOG.map((option): [string, string[]] => [
    option.code,
    [
      option.country.toLowerCase(),
      option.nationality.toLowerCase(),
      ...option.aliases,
      ...(SPECIAL_COUNTRY_TERMS[option.code] ?? []),
    ],
  ]),
  ["EU", ["eurozone", "european central bank", "ecb", "european union"]],
];

function textValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(" ");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["_", "#text", "value", "content", "href"]) {
      if (key in record) return textValue(record[key]);
    }
  }
  return "";
}

export function cleanText(value: unknown) {
  const raw = textValue(value);
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function termHits(text: string, terms: string[]) {
  return terms.reduce((count, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    return count + (pattern.test(text) ? 1 : 0);
  }, 0);
}

export function classifyArticle(
  title: string,
  summary: string,
  defaultCategory: Category | null,
  options?: { countryLocked?: boolean },
) {
  const text = `${title} ${summary}`.toLowerCase();
  const offTopic = OFF_TOPIC.some((term) => text.includes(term));
  const ranked = (Object.keys(TERMS) as Category[])
    .map((category) => ({ category, hits: termHits(text, TERMS[category]) }))
    .sort((a, b) => b.hits - a.hits);
  const best = ranked[0];
  const category = best.hits > 0 ? best.category : (defaultCategory ?? Category.MARKETS);
  const secondaryTags = ranked.filter((item) => item.hits > 0).map((item) => item.category);
  const marketHits = ranked.reduce((sum, item) => sum + item.hits, 0);
  const relevance = offTopic ? 0 : Math.min(100, best.hits * 28 + Math.min(30, marketHits * 4));

  return {
    category,
    secondaryTags,
    relevance,
    accepted: !offTopic && (relevance >= 28 || Boolean(options?.countryLocked)),
  };
}

export function detectCountry(text: string, fallback: string) {
  const normalized = text.toLowerCase();
  return COUNTRIES.find(([, terms]) => termHits(normalized, terms) > 0)?.[0] ?? fallback;
}

const MIDDLE_EAST_CODES = new Set([
  "KW", "SA", "AE", "EG", "QA", "BH", "OM", "SY", "JO", "IR", "IQ", "YE", "PS", "LB", "TR", "IL", "LY",
]);
const AMERICA_CODES = new Set(["US", "CA", "MX", "BR", "AR", "CL", "PY"]);

export function regionForCountry(country: string, fallback: Region) {
  if (MIDDLE_EAST_CODES.has(country)) return Region.MIDDLE_EAST;
  if (AMERICA_CODES.has(country)) return Region.AMERICA;
  return fallback;
}

export function calculateScores(input: {
  text: string;
  relevance: number;
  sourceQuality: number;
  publishedAt: Date;
}) {
  const text = input.text.toLowerCase();
  const ageHours = Math.max(0, (Date.now() - input.publishedAt.getTime()) / 3_600_000);
  const freshness = Math.max(0, Math.round(100 - ageHours * 1.5));
  const impact = (terms: string[]) => Math.min(100, termHits(text, terms) * 30);
  const goldImpact = impact(TERMS.GOLD);
  const usdImpact = impact(["dollar", "usd", "currency", "forex"]);
  const ratesImpact = impact(["interest rate", "federal reserve", "fed ", "ecb", "central bank", "yield"]);
  const oilImpact = impact(TERMS.OIL);
  const middleEastImpact = impact(["kuwait", "gcc", "saudi", "uae", "gulf", "middle east"]);
  const marketImpact = Math.min(100, Math.round(
    Math.max(goldImpact, ratesImpact, oilImpact) * 0.65 +
    Math.min(100, termHits(text, TERMS.FINANCE) * 18) * 0.35,
  ));
  const finalScore = Number((
    input.relevance * 0.3 +
    freshness * 0.18 +
    input.sourceQuality * 0.18 +
    goldImpact * 0.19 +
    marketImpact * 0.15
  ).toFixed(2));

  return {
    relevance: input.relevance,
    freshness,
    sourceQuality: input.sourceQuality,
    goldImpact,
    usdImpact,
    ratesImpact,
    oilImpact,
    middleEastImpact,
    marketImpact,
    finalScore,
    explanation: `relevance ${input.relevance}, freshness ${freshness}, source ${input.sourceQuality}, gold ${goldImpact}, market ${marketImpact}`,
  };
}
