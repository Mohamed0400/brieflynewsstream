import { Category, Region } from "@prisma/client";
import { COUNTRY_CATALOG } from "./countries";

const TERMS: Record<Category, string[]> = {
  GOLD: ["gold", "silver", "bullion", "precious metal", "xau", "jewellery", "jewelry", "central bank buying"],
  FINANCE: ["stock", "share", "bond", "yield", "dollar", "currency", "equity", "investor", "fund", "wall street", "market", "ipo", "dividend", "earnings"],
  ECONOMICS: ["inflation", "interest rate", "central bank", "federal reserve", "fed", "ecb", "monetary", "gdp", "economy", "economic", "jobs", "employment", "recession", "cpi"],
  OIL: ["oil", "crude", "brent", "opec", "energy price", "petroleum", "lng"],
  ME_ECONOMY: ["kuwait economy", "gcc", "gulf economy", "gulf markets", "middle east economy", "mena", "kuwait finance", "saudi economy", "uae economy", "kuwait stock", "boursa kuwait", "tadawul", "sovereign wealth fund"],
  COMMODITIES: ["commodity", "copper", "platinum", "palladium", "wheat", "natural gas", "mining"],
  BANKING: ["banking sector", "lender", "lending", "deposits", "loan", "credit growth", "islamic banking", "bank earnings", "capital ratio", "non-performing loans", "retail banking"],
  REAL_ESTATE: ["real estate", "property market", "property prices", "housing", "mortgage", "rents", "residential", "commercial property", "reit", "construction sector"],
  TECH: ["technology", "tech", "artificial intelligence", "ai", "semiconductor", "chipmaker", "software", "startup", "fintech", "e-commerce", "data center", "cloud computing", "cybersecurity"],
  ENERGY: ["electricity", "power grid", "renewable", "solar", "wind power", "nuclear", "utilities", "hydrogen", "power plant", "energy transition"],
  TRADE: ["trade", "exports", "imports", "tariff", "supply chain", "trade deal", "trade deficit", "wto", "customs", "free trade"],
  FX: ["forex", "exchange rate", "devaluation", "currency peg", "dollar index", "dinar", "riyal", "dirham", "euro", "yen", "yuan"],
  CRYPTO: ["crypto", "cryptocurrency", "bitcoin", "ethereum", "stablecoin", "blockchain", "digital asset", "token sale", "defi", "crypto exchange"],
  SHIPPING: ["shipping", "freight", "tanker", "container", "port authority", "logistics", "suez", "red sea shipping", "vessel", "maritime"],
  INSURANCE: ["insurance", "insurer", "reinsurance", "takaful", "premiums", "underwriting", "insurance claims"],
  POLICY: ["regulation", "regulator", "sanctions", "fiscal policy", "budget", "stimulus", "subsidy", "tax reform", "legislation", "economic reform", "privatisation", "privatization"],
  MARKETS: ["business", "price", "fiscal", "debt", "investment", "growth"],
};

const OFF_TOPIC = [
  "football", "soccer", "cricket", "celebrity", "movie", "film review",
  "fashion", "recipe", "murder", "crime", "gaming", "travel guide",
  "brand ambassador", "vodka", "head of research",
  "horoscope", "crossword", "word puzzle", "sudoku",
];

/** Lifestyle, weather, consumer-advice, and admin stories that are not market news. */
const NON_MARKET_SIGNALS = [
  "storm warning", "weather alert", "typhoon warning", "heavy rainfall", "heat wave",
  "fun and games", "puzzle", "board game", "video game",
  "name change", "change your name", "legal name", "rename ceremony",
  "fraud protection", "protect yourself from", "scam alert", "phishing", "romance scam",
  "fake listing", "fake listings", "rental scam", "online scam", "investment scam",
  "consumer tip", "life hack", "wellness tip", "health tip",
  "food review", "restaurant review", "recipe of the day",
  "traffic accident", "car crash", "missing person", "obituar",
  "pet adoption", "wildlife rescue", "charity walk", "marathon results",
];

/** Generic MARKETS bucket terms that alone should not qualify country-wide RSS feeds. */
const WEAK_MARKETS_TERMS = new Set([
  "business", "price", "growth",
]);

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

function matchesPhraseList(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function isWeakMarketOnly(
  text: string,
  ranked: Array<{ category: Category; hits: number }>,
  best: { category: Category; hits: number },
) {
  if (best.hits === 0) return true;
  const specificHits = ranked
    .filter((item) => item.category !== Category.MARKETS && item.hits > 0)
    .reduce((sum, item) => sum + item.hits, 0);
  if (specificHits > 0) return false;
  if (best.category !== Category.MARKETS) return false;
  const weakHits = TERMS.MARKETS.filter((term) => {
    if (!WEAK_MARKETS_TERMS.has(term)) return false;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  }).length;
  return weakHits > 0 && weakHits === best.hits;
}

export type ClassifiedArticle = {
  category: Category;
  secondaryTags: Category[];
  relevance: number;
  accepted: boolean;
  marketHits: number;
  weakMarketOnly: boolean;
};

function evaluateAcceptance(input: {
  offTopic: boolean;
  nonMarket: boolean;
  relevance: number;
  bestHits: number;
  bestCategory: Category;
  weakMarketOnly: boolean;
  countryLocked?: boolean;
}) {
  if (input.offTopic || input.nonMarket) return false;
  if (input.weakMarketOnly) return false;
  if (input.bestHits >= 2 && input.relevance >= 28) return true;
  if (input.bestHits >= 1 && input.bestCategory !== Category.MARKETS && input.relevance >= 28) {
    return true;
  }
  if (input.relevance >= 45 && input.bestHits >= 1) return true;
  if (input.countryLocked && input.bestHits >= 1 && input.relevance >= 36) return true;
  return input.relevance >= 28 && input.bestHits >= 1;
}

export function classifyArticle(
  title: string,
  summary: string,
  defaultCategory: Category | null,
  options?: { countryLocked?: boolean },
): ClassifiedArticle {
  const text = `${title} ${summary}`.toLowerCase();
  const offTopic = matchesPhraseList(text, OFF_TOPIC);
  const nonMarket = matchesPhraseList(text, NON_MARKET_SIGNALS);
  const ranked = (Object.keys(TERMS) as Category[])
    .map((category) => ({ category, hits: termHits(text, TERMS[category]) }))
    .sort((a, b) => b.hits - a.hits);
  const best = ranked[0];
  const category = best.hits > 0 ? best.category : (defaultCategory ?? Category.MARKETS);
  const secondaryTags = ranked.filter((item) => item.hits > 0).map((item) => item.category);
  const marketHits = ranked.reduce((sum, item) => sum + item.hits, 0);
  const weakMarketOnly = isWeakMarketOnly(text, ranked, best);
  const relevance = offTopic || nonMarket
    ? 0
    : Math.min(100, best.hits * 28 + Math.min(30, marketHits * 4));
  const accepted = evaluateAcceptance({
    offTopic,
    nonMarket,
    relevance,
    bestHits: best.hits,
    bestCategory: category,
    weakMarketOnly,
    countryLocked: options?.countryLocked,
  });

  return {
    category,
    secondaryTags,
    relevance,
    accepted,
    marketHits,
    weakMarketOnly,
  };
}

/** Final pipeline gate after scoring — catches low-signal stories that slip past keyword rules. */
export function shouldStoreArticle(
  classified: Pick<ClassifiedArticle, "accepted" | "relevance" | "weakMarketOnly">,
  scores: Pick<ReturnType<typeof calculateScores>, "marketImpact" | "finalScore">,
) {
  if (!classified.accepted) return false;
  if (classified.weakMarketOnly) return false;
  if (classified.relevance < 36 && scores.marketImpact < 20) return false;
  if (classified.relevance < 28 && scores.finalScore < 40) return false;
  return true;
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
