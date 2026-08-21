import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_CATALOG } from "./countries";
import {
  allLiveCountrySources,
  countriesNeedingArticles,
  countrySourceCoverage,
  generatedCountrySources,
  googleNewsRssUrl,
} from "./country-sources";

test("Google News RSS URLs encode the query", () => {
  const url = googleNewsRssUrl("Kuwait (economy OR markets)");
  assert.equal(url.startsWith("https://news.google.com/rss/search?q="), true);
  assert.equal(url.includes("Kuwait"), true);
  assert.equal(url.includes("hl=en-US"), true);
});

test("every catalog country has at least two live sources", () => {
  const { gaps, thin } = countrySourceCoverage();
  assert.deepEqual(gaps, []);
  assert.deepEqual(thin, []);
  const byCountry = new Map<string, number>();
  for (const source of allLiveCountrySources()) {
    byCountry.set(source.country, (byCountry.get(source.country) ?? 0) + 1);
  }
  for (const item of COUNTRY_CATALOG) {
    assert.ok((byCountry.get(item.code) ?? 0) >= 2, `${item.code} needs two sources`);
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

test("countries needing articles include empty and under-filled markets", () => {
  const counts = new Map<string, number>([["KW", 5], ["EG", 1]]);
  assert.deepEqual(countriesNeedingArticles(["KW", "EG", "QA"], counts, 3), ["EG", "QA"]);
});
