import assert from "node:assert/strict";
import test from "node:test";
import {
  isBlockedArticle,
  isBlockedContent,
  normalizeContentText,
} from "./content-safety";

test("normalizeContentText applies NFKC and collapses punctuation", () => {
  assert.equal(normalizeContentText("  Oil,  Bonds  "), "oil bonds");
  assert.equal(normalizeContentText("إبـاحـي"), normalizeContentText("إباحي"));
});

test("blocks explicit English adult headlines", () => {
  assert.equal(isBlockedContent("Porn site traffic surges after ban"), true);
  assert.equal(isBlockedContent("Celebrity sex tape leaks online"), true);
  assert.equal(isBlockedContent("OnlyFans creator earnings report"), true);
  assert.equal(isBlockedContent("Nude photos leak from private account"), true);
});

test("blocks vulgar English slang", () => {
  assert.equal(isBlockedContent("Viral fucking rant goes online"), true);
  assert.equal(isBlockedContent("Influencer slut-shaming row"), true);
});

test("blocks lifestyle and affair gossip", () => {
  assert.equal(isBlockedContent("CEO love affair scandal rocks firm"), true);
  assert.equal(isBlockedContent("Celebrity cheating scandal dominates tabloids"), true);
  assert.equal(isBlockedContent("New dating app launches premium tier"), true);
  assert.equal(isBlockedContent("Lingerie fashion show opens in Milan"), true);
});

test("blocks explicit Arabic headlines", () => {
  assert.equal(isBlockedContent("فضيحة جنسية تهز وسائل التواصل"), true);
  assert.equal(isBlockedContent("موقع إباحي يتصدر البحث"), true);
  assert.equal(isBlockedContent("صور عارية تنتشر على الإنترنت"), true);
  assert.equal(isBlockedContent("فضيحة حب بين ممثلين"), true);
});

test("allows legitimate market and policy headlines", () => {
  assert.equal(isBlockedContent("Oil rises as Fed signals hold"), false);
  assert.equal(isBlockedContent("Kuwait bonds rally on fiscal reform"), false);
  assert.equal(isBlockedContent("Gender pay gap narrows in banking sector"), false);
  assert.equal(isBlockedContent("Gender diversity targets set for GCC boards"), false);
  assert.equal(isBlockedContent("New anti-harassment policy at major lender"), false);
  assert.equal(isBlockedContent("Human trafficking law passes parliament"), false);
  assert.equal(isBlockedContent("المساواة بين الجنسين في القطاع المصرفي"), false);
  assert.equal(isBlockedContent("قانون الاتجار بالبشر يدخل حيز التنفيذ"), false);
});

test("allows place names containing sex substring", () => {
  assert.equal(isBlockedContent("Essex business park attracts logistics firms"), false);
  assert.equal(isBlockedContent("Middlesex University launches fintech hub"), false);
  assert.equal(isBlockedContent("Sussex county bond issuance oversubscribed"), false);
});

test("isBlockedArticle checks all localized fields", () => {
  assert.equal(isBlockedArticle({
    title: "Markets steady",
    summary: "Bonds unchanged.",
    titleEn: "Markets steady",
    summaryEn: "Bonds unchanged.",
    titleAr: "فضيحة جنسية",
    summaryAr: null,
  }), true);

  assert.equal(isBlockedArticle({
    title: "Oil prices climb",
    summary: "Brent gains on supply cuts.",
    titleEn: "Oil prices climb",
    summaryEn: "Brent gains on supply cuts.",
    titleAr: "ارتفاع أسعار النفط",
    summaryAr: "مكاسب برنت",
  }), false);
});
