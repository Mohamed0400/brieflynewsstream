import assert from "node:assert/strict";
import test from "node:test";
import {
  articleLocalizedText,
  hasArabicDisplay,
  hasEnglishDisplay,
  sortArticlesForTranslation,
} from "./article-translation";

const englishArticle = {
  language: "en",
  title: "Kuwait markets steady",
  summary: "Trading held firm in early sessions.",
  displayTitle: "Kuwait markets steady",
  displaySummary: "Trading held firm in early sessions.",
  titleEn: "Kuwait markets steady",
  summaryEn: "Trading held firm in early sessions.",
  titleAr: null as string | null,
  summaryAr: null as string | null,
};

const bilingualArticle = {
  language: "en",
  title: "Gold prices rise in Kuwait",
  summary: "Bullion gained as the dollar eased.",
  displayTitle: "Gold prices rise in Kuwait",
  displaySummary: "Bullion gained as the dollar eased.",
  titleEn: "Gold prices rise in Kuwait",
  summaryEn: "Bullion gained as the dollar eased.",
  titleAr: "أسعار الذهب ترتفع في الكويت",
  summaryAr: "ارتفع المعدن مع تراجع الدولار.",
};

test("Arabic display never falls back to English", () => {
  const localized = articleLocalizedText(englishArticle, "ar");
  assert.equal(localized.title, "");
  assert.equal(localized.summary, "");
  assert.equal(hasArabicDisplay(englishArticle), false);
});

test("English display never falls back to Arabic", () => {
  const arabicOnly = {
    language: "ar",
    title: "أسعار الذهب ترتفع",
    summary: "ارتفع المعدن مع تراجع الدولار.",
    displayTitle: "أسعار الذهب ترتفع",
    displaySummary: "ارتفع المعدن مع تراجع الدولار.",
    titleEn: null as string | null,
    summaryEn: null as string | null,
    titleAr: "أسعار الذهب ترتفع",
    summaryAr: "ارتفع المعدن مع تراجع الدولار.",
  };
  const localized = articleLocalizedText(arabicOnly, "en");
  assert.equal(localized.title, "");
  assert.equal(localized.summary, "");
  assert.equal(hasEnglishDisplay(arabicOnly), false);
});

test("localized display uses the matching language when bilingual", () => {
  const arabic = articleLocalizedText(bilingualArticle, "ar");
  assert.equal(arabic.title, "أسعار الذهب ترتفع في الكويت");
  const english = articleLocalizedText(bilingualArticle, "en");
  assert.equal(english.title, "Gold prices rise in Kuwait");
  assert.equal(hasArabicDisplay(bilingualArticle), true);
  assert.equal(hasEnglishDisplay(bilingualArticle), true);
});

test("translation queue prioritizes Kuwait, global/US/EU/CN desk, then Gulf", () => {
  const now = Date.now();
  const sorted = sortArticlesForTranslation([
    { id: "us", country: "US", publishedAt: new Date(now), category: "MARKETS" },
    { id: "kw", country: "KW", publishedAt: new Date(now - 60_000), category: "ME_ECONOMY" },
    { id: "ae", country: "AE", publishedAt: new Date(now), category: "ME_ECONOMY" },
    { id: "eg", country: "EG", publishedAt: new Date(now), category: "ME_ECONOMY" },
    { id: "kw-gold", country: "KW", publishedAt: new Date(now - 120_000), category: "GOLD" },
    { id: "cn-gold", country: "CN", publishedAt: new Date(now), category: "GOLD" },
    { id: "eu", country: "EU", publishedAt: new Date(now), category: "ECONOMICS" },
  ]);
  assert.deepEqual(sorted.map((item) => item.id), ["kw-gold", "kw", "us", "eu", "cn-gold", "ae", "eg"]);
});
