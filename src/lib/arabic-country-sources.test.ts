import assert from "node:assert/strict";
import test from "node:test";
import { arabicLiveSources, isArabicCollectEnabled } from "./arabic-country-sources";

test("arabic live catalog is Arabic-only and on the arabic pipeline", () => {
  const sources = arabicLiveSources();
  assert.ok(sources.length >= 50, `expected at least 50 Arabic sources, got ${sources.length}`);
  const codes = new Set<string>();
  const urls = new Set<string>();
  for (const source of sources) {
    assert.equal(source.sourceLocale, "ar");
    assert.equal(source.collectPipeline, "arabic");
    assert.equal(codes.has(source.code), false, `duplicate code ${source.code}`);
    assert.equal(urls.has(source.url), false, `duplicate url ${source.url}`);
    codes.add(source.code);
    urls.add(source.url);
  }
});

test("arabic catalog covers Kuwait, global, China, and Europe desk", () => {
  const countries = new Set(arabicLiveSources().map((source) => source.country));
  for (const code of ["KW", "GLOBAL", "CN", "EU"]) {
    assert.ok(countries.has(code), `missing desk country ${code}`);
  }
});

test("isArabicCollectEnabled respects kill switch", () => {
  const prev = process.env.ARABIC_COLLECT_ENABLED;
  process.env.ARABIC_COLLECT_ENABLED = "false";
  assert.equal(isArabicCollectEnabled(), false);
  process.env.ARABIC_COLLECT_ENABLED = "true";
  assert.equal(isArabicCollectEnabled(), true);
  if (prev === undefined) delete process.env.ARABIC_COLLECT_ENABLED;
  else process.env.ARABIC_COLLECT_ENABLED = prev;
});
