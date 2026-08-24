import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_CATALOG } from "./countries";
import {
  allLiveCountrySources,
  allSeedSources,
  countriesNeedingArticles,
  countrySourceCoverage,
  generatedCountrySources,
  googleNewsRssUrl,
  RETIRED_COUNTRY_SOURCE_CODES,
} from "./country-sources";

test("Google News RSS URLs encode the query", () => {
  const url = googleNewsRssUrl("Kuwait (economy OR markets)");
  assert.equal(url.startsWith("https://news.google.com/rss/search?q="), true);
  assert.equal(url.includes("Kuwait"), true);
  assert.equal(url.includes("hl=en-US"), true);
});

test("every catalog country has at least eight live sources", () => {
  const { gaps, thin } = countrySourceCoverage();
  assert.deepEqual(gaps, []);
  assert.deepEqual(thin, []);
  const byCountry = new Map<string, number>();
  for (const source of allLiveCountrySources()) {
    byCountry.set(source.country, (byCountry.get(source.country) ?? 0) + 1);
  }
  for (const item of COUNTRY_CATALOG) {
    assert.ok((byCountry.get(item.code) ?? 0) >= 8, `${item.code} needs eight sources`);
  }
});

test("generated country source names stay vendor-neutral", () => {
  for (const source of generatedCountrySources()) {
    assert.equal(/google news/i.test(source.name), false, source.name);
  }
});

test("generated country source codes are unique", () => {
  const generated = generatedCountrySources();
  const live = allLiveCountrySources();
  const codes = live.map((source) => source.code);
  const urls = live.map((source) => source.url);
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(generated.length >= COUNTRY_CATALOG.length * 2);
});

test("seed catalog has unique codes and urls and is at least 1500 sources", () => {
  const { codes, urls, live } = allSeedSources();
  assert.equal(new Set(codes).size, codes.length, "duplicate source codes");
  assert.equal(new Set(urls).size, urls.length, "duplicate source urls");
  assert.ok(live.length >= 2000, `live country sources ${live.length} < 2000`);
  assert.ok(codes.length >= 2000, `total unique sources ${codes.length} < 2000`);
});

test("catalog includes at least one hundred Investing.com RSS sources", () => {
  const investing = allSeedSources().urls.filter((url) => url.includes("investing.com"));
  assert.ok(investing.length >= 100, `investing.com sources ${investing.length} < 100`);
});

test("retired source codes stay out of the live list", () => {
  const retired = new Set<string>(RETIRED_COUNTRY_SOURCE_CODES);
  for (const source of allLiveCountrySources()) {
    assert.equal(retired.has(source.code), false, source.code);
  }
});

test("countries needing articles include empty and under-filled markets", () => {
  const counts = new Map<string, number>([["KW", 5], ["EG", 1]]);
  assert.deepEqual(countriesNeedingArticles(["KW", "EG", "QA"], counts, 3), ["EG", "QA"]);
});
