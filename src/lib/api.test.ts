import assert from "node:assert/strict";
import test from "node:test";
import { describeQueryFailure, parseQuery, publicLanguageFields, searchContains } from "./api";
import {
  articleLocalizedText,
  isBilingualComplete,
  seedBilingualFields,
  summarizeBilingualCoverage,
} from "./article-translation";
import { expandSearchQuery } from "./search";

test("API query supports text, source, and language filters", () => {
  const query = parseQuery(new URLSearchParams({
    q: "gold",
    searchIn: "title",
    source: "KITCO,FED",
    language: "EN",
    limit: "20",
  }));

  assert.equal(query.limit, 20);
  assert.equal(query.filters.q, "gold");
  assert.equal(query.filters.searchIn, "title");
  assert.equal(query.filters.source, "KITCO,FED");
  assert.equal(query.filters.language, "en");
  assert.deepEqual(query.where.source, { code: { in: ["KITCO", "FED"] } });
  assert.equal(query.where.language, "en");
  assert.deepEqual(query.where.AND, [{
    OR: [{
      AND: [{
        OR: [
          { title: searchContains("gold") },
          { displayTitle: searchContains("gold") },
          { titleEn: searchContains("gold") },
          { titleAr: searchContains("gold") },
        ],
      }],
    }],
  }]);
});

test("invalid search locations fall back to title and summary", () => {
  const query = parseQuery(new URLSearchParams({
    q: "inflation",
    searchIn: "unsupported",
  }));

  assert.equal(query.filters.searchIn, "both");
  assert.deepEqual(query.where.AND, [{
    OR: [{
      AND: [{
        OR: [
          { title: searchContains("inflation") },
          { displayTitle: searchContains("inflation") },
          { titleEn: searchContains("inflation") },
          { titleAr: searchContains("inflation") },
          { summary: searchContains("inflation") },
          { displaySummary: searchContains("inflation") },
          { summaryEn: searchContains("inflation") },
          { summaryAr: searchContains("inflation") },
        ],
      }],
    }],
  }]);
});

test("Arabic financial searches expand to English", async () => {
  assert.deepEqual(await expandSearchQuery("ذهب"), ["ذهب", "gold"]);
  assert.deepEqual(
    await expandSearchQuery("سعر الذهب اليوم"),
    ["سعر الذهب اليوم", "price gold today"],
  );
});

test("Egypt searches translate without falling back to Kuwait", async () => {
  assert.deepEqual(await expandSearchQuery("مصر"), ["مصر", "egypt"]);
  assert.deepEqual(await expandSearchQuery("ذهب مصر"), ["ذهب مصر", "gold egypt"]);

  const query = parseQuery(
    new URLSearchParams({ q: "مصر" }),
    { searchVariants: ["مصر", "egypt"] },
  );
  const serialized = JSON.stringify(query.where.AND);
  assert.match(serialized, /"contains":"مصر"/);
  assert.match(serialized, /"contains":"egypt"/);
  assert.match(serialized, /"country":"EG"/);
  assert.doesNotMatch(serialized, /"country":"KW"/);
});

test("text search matches case-insensitively", () => {
  const query = parseQuery(new URLSearchParams({ q: "Gold", searchIn: "title" }));
  const serialized = JSON.stringify(query.where.AND);
  assert.match(serialized, /"contains":"Gold"/);
  assert.match(serialized, /"mode":"insensitive"/);
});

test("multi-word searches require every word but not phrase order", () => {
  const query = parseQuery(new URLSearchParams({ q: "gold price today" }));
  const serialized = JSON.stringify(query.where.AND);

  assert.match(serialized, /"contains":"gold"/);
  assert.match(serialized, /"contains":"price"/);
  assert.doesNotMatch(serialized, /"contains":"today"/);
  assert.equal((query.where.AND as Array<{ OR: Array<{ AND: unknown[] }> }>)[0].OR[0].AND.length, 2);
});

test("current feeds default to 72 hours while explicit dates allow history", () => {
  const current = parseQuery(new URLSearchParams());
  assert.equal(current.filters.freshnessHours, 72);
  assert.ok((current.where.publishedAt as { gte?: Date }).gte instanceof Date);

  const historical = parseQuery(new URLSearchParams({ date: "2025-12-11" }));
  assert.equal(historical.filters.freshnessHours, null);
  assert.deepEqual(historical.where.publishedAt, {
    gte: new Date("2025-12-11T00:00:00+03:00"),
    lt: new Date("2025-12-12T00:00:00+03:00"),
  });

  const storedEdition = parseQuery(
    new URLSearchParams(),
    { applyDefaultFreshness: false },
  );
  assert.equal(storedEdition.filters.freshnessHours, null);
  assert.equal(storedEdition.where.publishedAt, undefined);
});

test("query failures distinguish Prisma client drift from invalid input", () => {
  const prismaFailure = describeQueryFailure(
    new Error("Invalid `prisma.article.findMany()` invocation:\nUnknown argument `titleEn`. Did you mean `title`?"),
  );
  assert.equal(prismaFailure.status, 500);
  assert.equal(prismaFailure.error, "server_error");
  assert.match(prismaFailure.message, /Restart/);
  assert.doesNotMatch(prismaFailure.message, /titleEn|findMany|prisma/);

  const unreachable = describeQueryFailure(
    new Error("Can't reach database server at `aws-0-ap-northeast-1.pooler.supabase.com:6543`"),
  );
  assert.equal(unreachable.status, 503);
  assert.doesNotMatch(unreachable.message, /supabase|6543|aws-0/i);

  const invalid = describeQueryFailure(new Error("date must be YYYY-MM-DD"));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.error, "invalid_query");
  assert.equal(invalid.message, "date must be YYYY-MM-DD");
});

test("lang selects display language without filtering source language", () => {
  const arabic = parseQuery(new URLSearchParams({ q: "ذهب" }));
  assert.equal(arabic.filters.lang, "ar");
  assert.equal(arabic.where.language, undefined);

  const english = parseQuery(new URLSearchParams({ q: "gold", lang: "en" }));
  assert.equal(english.filters.lang, "en");
  assert.equal(english.where.language, undefined);

  const sourceFilter = parseQuery(new URLSearchParams({ language: "en" }));
  assert.equal(sourceFilter.where.language, "en");
  assert.equal(sourceFilter.filters.lang, "ar");

  const both = parseQuery(new URLSearchParams({ language: "en", lang: "en" }));
  assert.equal(both.where.language, "en");
  assert.equal(both.filters.lang, "en");
});

test("Arabic display language prefers stored Arabic titles", () => {
  const article = {
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
  const arabic = articleLocalizedText(article, "ar");
  assert.equal(arabic.title, "أسعار الذهب ترتفع في الكويت");
  assert.match(arabic.summary, /ارتفع/);

  const englishPoisoned = articleLocalizedText({
    ...article,
    titleAr: "Gold prices rise in Kuwait",
  }, "ar");
  assert.equal(englishPoisoned.title, "Gold prices rise in Kuwait");
});

test("source language seeds only that side of the bilingual pair", () => {
  const arabic = seedBilingualFields("أسعار الذهب ترتفع", "ارتفع المعدن مع تراجع الدولار.");
  assert.equal(arabic.language, "ar");
  assert.equal(arabic.titleAr, "أسعار الذهب ترتفع");
  assert.equal(arabic.titleEn, null);

  const english = seedBilingualFields("Gold prices rise", "Bullion gained as the dollar eased.");
  assert.equal(english.language, "en");
  assert.equal(english.titleEn, "Gold prices rise");
  assert.equal(english.titleAr, null);
});

test("bilingual complete requires real English and Arabic text", () => {
  assert.equal(isBilingualComplete({
    titleEn: "Gold prices rise",
    summaryEn: "Bullion gained as the dollar eased.",
    titleAr: "أسعار الذهب ترتفع",
    summaryAr: "ارتفع المعدن مع تراجع الدولار.",
  }), true);
  assert.equal(isBilingualComplete({
    titleEn: "أسعار الذهب ترتفع",
    summaryEn: "ارتفع المعدن مع تراجع الدولار.",
    titleAr: "أسعار الذهب ترتفع",
    summaryAr: "ارتفع المعدن مع تراجع الدولار.",
  }), false);
  assert.equal(isBilingualComplete({
    titleEn: "Gold prices rise",
    summaryEn: "Bullion gained as the dollar eased.",
    titleAr: "Gold prices rise",
    summaryAr: "Bullion gained as the dollar eased.",
  }), false);
});

test("bilingual coverage is complete only when every article has en and ar", () => {
  const complete = summarizeBilingualCoverage([{
    titleEn: "Gold prices rise",
    summaryEn: "Bullion gained as the dollar eased.",
    titleAr: "أسعار الذهب ترتفع",
    summaryAr: "ارتفع المعدن مع تراجع الدولار.",
  }]);
  assert.equal(complete.ok, true);
  assert.equal(complete.complete, 1);

  const incomplete = summarizeBilingualCoverage([{
    titleEn: "Gold prices rise",
    summaryEn: "Bullion gained as the dollar eased.",
    titleAr: null,
    summaryAr: null,
  }]);
  assert.equal(incomplete.ok, false);
  assert.equal(incomplete.missingArabic, 1);
});

test("public stories expose arabic and english objects, not suffix fields", () => {
  const fields = publicLanguageFields({
    title: "Gold prices rise",
    summary: "Bullion gained as the dollar eased.",
    displayTitle: "Gold prices rise",
    displaySummary: "Bullion gained as the dollar eased.",
    titleEn: "Gold prices rise",
    summaryEn: "Bullion gained as the dollar eased.",
    titleAr: "أسعار الذهب ترتفع",
    summaryAr: "ارتفع المعدن مع تراجع الدولار.",
  });
  assert.equal(fields.arabic.title, "أسعار الذهب ترتفع");
  assert.equal(fields.english.title, "Gold prices rise");
  assert.equal("titleAr" in fields, false);
  assert.equal("titleEn" in fields, false);
});

test("API docs catalog lists every public v1 route", async () => {
  const { apiDocGroups, findApiDocEndpoint } = await import("./api-docs");
  const paths = apiDocGroups.flatMap((group) =>
    group.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
  );
  for (const expected of [
    "GET /api/v1/market-news",
    "GET /api/v1/market-news/nationality",
    "GET /api/v1/market-news/today",
    "GET /api/v1/market-news/daily",
    "GET /api/v1/market-news/editions",
    "GET /api/v1/meta/categories",
    "GET /api/v1/meta/countries",
    "GET /api/v1/meta/nationalities",
    "GET /api/v1/sources",
    "GET /api/cron/collect",
    "POST /api/v1/admin/collect",
    "POST /api/v1/admin/rebuild-edition",
  ]) {
    assert.ok(paths.includes(expected), `missing ${expected}`);
  }
  const feed = findApiDocEndpoint("feeds", "market-news");
  assert.equal(feed.path, "/api/v1/market-news");
  assert.ok(feed.query?.some((param) => param.name === "q"));
});

test("console copy defaults to Arabic and keeps English keys in sync", async () => {
  const {
    consoleDashboardCopy,
    consoleLoginLang,
  } = await import("./console-translation");

  assert.equal(consoleLoginLang(undefined), "ar");
  assert.equal(consoleLoginLang("en"), "en");
  assert.equal(consoleLoginLang("fr"), "ar");

  const ar = consoleDashboardCopy("ar");
  const en = consoleDashboardCopy("en");
  assert.equal(ar.nav.schedule, "الجدول");
  assert.equal(en.nav.schedule, "Schedule");
  assert.deepEqual(Object.keys(ar.apiDocs.groups), Object.keys(en.apiDocs.groups));
  assert.equal(en.apiDocs.groups.overview.label, "Overview");
  assert.equal(ar.schedule.online, "متصل");
});
