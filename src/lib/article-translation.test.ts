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

test("translation queue prioritizes Kuwait and Gulf markets", () => {
  const now = Date.now();
  const sorted = sortArticlesForTranslation([
    { id: "us", country: "US", publishedAt: new Date(now) },
    { id: "kw", country: "KW", publishedAt: new Date(now - 60_000) },
    { id: "ae", country: "AE", publishedAt: new Date(now) },
    { id: "eg", country: "EG", publishedAt: new Date(now) },
  ]);
  assert.deepEqual(sorted.map((item) => item.id), ["kw", "ae", "eg", "us"]);
});
