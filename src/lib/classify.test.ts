import assert from "node:assert/strict";
import test from "node:test";
import { Category } from "@prisma/client";
import { COUNTRY_CATALOG } from "./countries";
import { classifyArticle, detectCountry } from "./classify";
import { normalizeDisplayHeadline } from "./editorial";
import {
  audienceCodesFromValue,
  audienceValue,
  expandNationalityInputs,
} from "./nationalities";
import { supportedCountryCodes } from "./supported-countries";
import { countrySourceCoverage } from "./country-sources";

test("classifies gold market news", () => {
  const result = classifyArticle(
    "Gold rises as softer inflation boosts Fed rate-cut expectations",
    "Bullion gained while the dollar and Treasury yields declined.",
    Category.MARKETS,
  );
  assert.equal(result.category, Category.GOLD);
  assert.equal(result.accepted, true);
  assert.ok(result.relevance >= 50);
});

test("does not mistake Goldman or an Au brand for gold", () => {
  const goldman = classifyArticle(
    "Goldman Sachs hires a new technology executive",
    "The bank announced an internal appointment.",
    Category.FINANCE,
  );
  assert.notEqual(goldman.category, Category.GOLD);

  const vodka = classifyArticle(
    "Viral vodka brand Au set to sell to drinks owner",
    "The celebrity beverage company announced a transaction.",
    Category.MARKETS,
  );
  assert.equal(vodka.accepted, false);
});

test("rejects clearly off-topic content", () => {
  const result = classifyArticle(
    "Football star signs record contract",
    "The celebrity player joins a new team.",
    Category.MARKETS,
  );
  assert.equal(result.accepted, false);
});

test("detects Kuwait and US context", () => {
  assert.equal(detectCountry("CBK updates Kuwait monetary policy", "GLOBAL"), "KW");
  assert.equal(detectCountry("Federal Reserve discusses rates", "GLOBAL"), "US");
});

test("detects expanded market countries without UK stealing Ukraine", () => {
  assert.equal(detectCountry("Qatar central bank holds rates in Doha", "GLOBAL"), "QA");
  assert.equal(detectCountry("Germany inflation cools in Berlin", "GLOBAL"), "DE");
  assert.equal(detectCountry("Brazil's central bank holds rates in Brasilia", "GLOBAL"), "BR");
  assert.equal(detectCountry("Ukraine grain exports rise from Kyiv", "GLOBAL"), "UA");
});

test("resolves nationality codes, aliases, and the Africa group", () => {
  assert.deepEqual(expandNationalityInputs(["egyptions"]), ["EG"]);
  assert.deepEqual(expandNationalityInputs(["filipino", "sirilank"]), ["PH", "LK"]);
  assert.deepEqual(expandNationalityInputs(["emirati"]), ["AE"]);
  assert.deepEqual(
    expandNationalityInputs(["AFRICA"]),
    ["EG", "ET", "SD", "NG", "KE", "MA", "TN", "DZ"],
  );
  assert.equal(detectCountry("New measures announced in Syria", "GLOBAL"), "SY");
});

test("country catalog covers about 70 ISO markets", () => {
  const codes = COUNTRY_CATALOG.map((item) => item.code);
  assert.equal(COUNTRY_CATALOG.length, 70);
  assert.equal(new Set(codes).size, 70);
  assert.ok(COUNTRY_CATALOG.every((item) => item.code.length === 2));
  assert.ok(COUNTRY_CATALOG.some((item) => item.code === "DE" && !item.community));
  assert.ok(COUNTRY_CATALOG.some((item) => item.code === "AE" && item.community));
  const supported = supportedCountryCodes();
  assert.ok(supported.includes("DE"));
  assert.ok(supported.includes("QA"));
  assert.ok(supported.includes("EU"));
  assert.ok(supported.length >= 72);
});

test("every catalog country has at least two scrape sources", () => {
  const { gaps, thin } = countrySourceCoverage();
  assert.deepEqual(gaps, []);
  assert.deepEqual(thin, []);
});

test("stores audience codes as exact, multi-value tokens", () => {
  const stored = audienceValue(["IN", "EG", "IN"]);
  assert.equal(stored, "|IN||EG|");
  assert.deepEqual(audienceCodesFromValue(stored), ["IN", "EG"]);
});

test("display headlines never retain truncation marks", () => {
  assert.equal(
    normalizeDisplayHeadline("Gold rises as Fed rate expectations shift..."),
    "Gold rises as Fed rate expectations shift",
  );
  assert.equal(
    normalizeDisplayHeadline("Kuwait stocks close higher —"),
    "Kuwait stocks close higher",
  );
});
