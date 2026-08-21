import { COUNTRY_CATALOG } from "./countries";
import { ARABIC_COUNTRY_NAMES } from "./supported-countries";

const ARABIC_TEXT = /[\u0600-\u06ff]/;
const MAX_SEARCH_WORDS = 12;
const SEARCH_FILLER_WORDS = new Set([
  "a",
  "an",
  "the",
  "today",
  "latest",
  "current",
  "news",
  "update",
  "of",
  "for",
  "in",
  "عن",
  "في",
  "من",
  "اليوم",
  "أخبار",
  "اخبار",
  "آخر",
  "اخر",
  "تحديث",
]);

const financeTranslations = new Map([
  ["ذهب", "gold"],
  ["الذهب", "gold"],
  ["سعر", "price"],
  ["أسعار", "prices"],
  ["اسعار", "prices"],
  ["اليوم", "today"],
  ["سوق", "market"],
  ["الأسواق", "markets"],
  ["الاسواق", "markets"],
  ["نفط", "oil"],
  ["النفط", "oil"],
  ["دولار", "dollar"],
  ["الدولار", "dollar"],
  ["تضخم", "inflation"],
  ["التضخم", "inflation"],
  ["فائدة", "interest"],
  ["الفائدة", "interest"],
  ["اقتصاد", "economy"],
  ["الاقتصاد", "economy"],
  ["مال", "finance"],
  ["مالية", "financial"],
  ["الكويت", "kuwait"],
]);

const EXTRA_PLACE_WORDS: Array<[token: string, english: string, code: string]> = [
  ["مصر", "egypt", "EG"],
  ["مصري", "egyptian", "EG"],
  ["المصري", "egyptian", "EG"],
  ["المصرية", "egyptian", "EG"],
  ["المصريين", "egypt", "EG"],
  ["القاهرة", "cairo", "EG"],
  ["كويت", "kuwait", "KW"],
  ["كويتي", "kuwaiti", "KW"],
  ["الكويتي", "kuwaiti", "KW"],
  ["الكويتية", "kuwaiti", "KW"],
  ["سعودي", "saudi", "SA"],
  ["السعودي", "saudi", "SA"],
  ["إماراتي", "emirati", "AE"],
  ["الامارات", "uae", "AE"],
  ["دبي", "dubai", "AE"],
];

const placeTranslations = new Map<string, string>();
const placeCountryCodes = new Map<string, string>();
const TRANSLATION_CACHE_MAX = 400;
const translationCache = new Map<string, string>();

function rememberTranslation(query: string, translated: string) {
  if (translationCache.size >= TRANSLATION_CACHE_MAX) {
    const oldest = translationCache.keys().next().value;
    if (oldest) translationCache.delete(oldest);
  }
  translationCache.set(query, translated);
}

function placeKey(token: string) {
  return ARABIC_TEXT.test(token) ? token : token.toLocaleLowerCase("en");
}

function addPlace(token: string, english: string, code: string) {
  const normalized = token.trim();
  if (!normalized) return;
  const key = placeKey(normalized);
  if (!placeTranslations.has(key)) placeTranslations.set(key, english.toLocaleLowerCase("en"));
  if (!placeCountryCodes.has(key)) placeCountryCodes.set(key, code.toUpperCase());
}

for (const option of COUNTRY_CATALOG) {
  addPlace(option.code, option.country, option.code);
  addPlace(option.country, option.country, option.code);
  addPlace(option.nationality, option.nationality, option.code);
  addPlace(option.nameAr, option.country, option.code);
  addPlace(option.nationalityAr, option.nationality, option.code);
  for (const alias of option.aliases) addPlace(alias, alias, option.code);
}

for (const [code, arabic] of Object.entries(ARABIC_COUNTRY_NAMES)) {
  addPlace(arabic, placeTranslations.get(placeKey(code)) || code, code);
}

for (const [token, english, code] of EXTRA_PLACE_WORDS) addPlace(token, english, code);

function wordTranslation(word: string) {
  return financeTranslations.get(word) || placeTranslations.get(placeKey(word)) || "";
}

export function countryCodesForSearchWord(word: string) {
  const direct = placeCountryCodes.get(placeKey(word));
  if (direct) return [direct];
  if (word.startsWith("ال") && word.length > 3) {
    const stripped = placeCountryCodes.get(placeKey(word.slice(2)));
    if (stripped) return [stripped];
  }
  return [];
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 200);
}

function glossaryTranslation(query: string) {
  const words = query.split(" ").filter(Boolean);
  if (!words.length) return "";
  const mapped = words.map((word) => {
    const translated = wordTranslation(word);
    if (translated) return translated;
    if (word.startsWith("ال") && word.length > 3) return wordTranslation(word.slice(2));
    return ARABIC_TEXT.test(word) ? "" : word;
  });
  if (mapped.some((word, index) => ARABIC_TEXT.test(words[index]) && !mapped[index])) return "";
  const english = mapped.join(" ").trim();
  if (!english || english.toLocaleLowerCase("en") === query.toLocaleLowerCase("en")) return "";
  return english;
}

function translationIntroducesForeignCountry(original: string, translated: string) {
  const originalCodes = new Set(searchWords(original).flatMap(countryCodesForSearchWord));
  return searchWords(translated)
    .flatMap(countryCodesForSearchWord)
    .some((code) => !originalCodes.has(code));
}

function extractOutputText(payload: {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}) {
  const output = payload.steps?.filter((step) => step.type === "model_output").at(-1);
  return (output?.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("")
    .trim();
}

async function translateArabicWithGoogle(query: string) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return "";

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    signal: AbortSignal.timeout(8_000),
    body: JSON.stringify({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      input: [
        "Translate this Arabic financial-news search query into concise English search keywords.",
        "Translate only the words present in the query. Do not add countries, markets, or extra topics.",
        "If the query is a country or city name, return only that place in English.",
        "Return only the translation, with no explanation or punctuation.",
        query,
      ].join("\n"),
    }),
  });
  const payload = await response.json() as {
    steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  };
  return response.ok ? normalizeSearchText(extractOutputText(payload)) : "";
}

export function searchWords(query: string) {
  const words = normalizeSearchText(query)
    .split(" ")
    .filter(Boolean)
    .filter((word) => !SEARCH_FILLER_WORDS.has(word.toLocaleLowerCase()))
    .slice(0, MAX_SEARCH_WORDS);
  return words.length ? words : normalizeSearchText(query).split(" ").filter(Boolean).slice(0, 1);
}

export async function expandSearchQuery(query: string, options?: { remote?: boolean }) {
  const normalized = normalizeSearchText(query);
  if (!normalized || !ARABIC_TEXT.test(normalized)) return [normalized].filter(Boolean);

  const cached = translationCache.get(normalized);
  if (cached) return [normalized, cached];

  const glossary = glossaryTranslation(normalized);
  let translated = glossary;
  if (!translated && options?.remote) {
    try {
      translated = await translateArabicWithGoogle(normalized);
    } catch {
      translated = "";
    }
  }

  if (!translated || translated.toLocaleLowerCase("en") === normalized.toLocaleLowerCase("en")) {
    return [normalized];
  }
  if (translationIntroducesForeignCountry(normalized, translated) || !searchWords(translated).length) {
    return [normalized];
  }
  rememberTranslation(normalized, translated);
  return [normalized, translated];
}
