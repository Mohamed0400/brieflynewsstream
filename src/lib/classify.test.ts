import assert from "node:assert/strict";
import test from "node:test";
import { Category } from "@prisma/client";
import { COUNTRY_CATALOG } from "./countries";
import { classifyArticle, detectCountry, shouldStoreArticle, calculateScores } from "./classify";
import { normalizeDisplayHeadline } from "./editorial";
import {
  audienceCodesFromValue,
  audienceValue,
  expandNationalityInputs,
  sortAudienceCodesByEditorialOrder,
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

test("classifies expanded market topics", () => {
  const crypto = classifyArticle(
    "Bitcoin climbs as stablecoin rules advance",
    "Crypto exchange volumes rose after the announcement.",
    Category.MARKETS,
  );
  assert.equal(crypto.category, Category.CRYPTO);
  assert.equal(crypto.accepted, true);

  const realEstate = classifyArticle(
    "Gulf real estate deals accelerate as property prices firm",
    "Mortgage demand and residential rents climbed across the region.",
    Category.MARKETS,
  );
  assert.equal(realEstate.category, Category.REAL_ESTATE);
  assert.equal(realEstate.accepted, true);

  const shipping = classifyArticle(
    "Container freight rates jump on Red Sea shipping disruption",
    "Tanker and vessel traffic shifted to longer maritime routes.",
    Category.MARKETS,
  );
  assert.equal(shipping.category, Category.SHIPPING);
  assert.equal(shipping.accepted, true);

  const fx = classifyArticle(
    "Dinar steady as forex reserves rise",
    "The exchange rate held firm against the euro and yen.",
    Category.MARKETS,
  );
  assert.equal(fx.category, Category.FX);
  assert.equal(fx.accepted, true);
});

test("rejects clearly off-topic content", () => {
  const result = classifyArticle(
    "Football star signs record contract",
    "The celebrity player joins a new team.",
    Category.MARKETS,
  );
  assert.equal(result.accepted, false);
});

test("rejects Taipei Times lifestyle and consumer stories on country-locked TW sources", () => {
  const countryLocked = { countryLocked: true };
  const cases = [
    ["Protecting ourselves from fraud schemes", "Consumer tips on avoiding online scams and phishing."],
    ["Fun and games for the weekend", "Crossword puzzles and board games to try at home."],
    ["The importance of changing your name", "Administrative guidance on legal name changes."],
    ["Storm warning issued for northern counties", "Heavy rainfall and typhoon alerts across the region."],
    ["Warning about fake property listings online", "Rental scam alerts and fake listings on social media."],
  ] as const;

  for (const [title, summary] of cases) {
    const classified = classifyArticle(title, summary, Category.MARKETS, countryLocked);
    assert.equal(classified.accepted, false, `expected rejection for "${title}"`);
    const scores = calculateScores({
      text: `${title} ${summary}`,
      relevance: classified.relevance,
      sourceQuality: 78,
      publishedAt: new Date(),
    });
    assert.equal(shouldStoreArticle(classified, scores), false, `expected pipeline rejection for "${title}"`);
  }
});

test("accepts genuine Taiwan market news on country-locked TW sources", () => {
  const countryLocked = { countryLocked: true };
  const classified = classifyArticle(
    "Taiwan semiconductor exports rise on AI chip demand",
    "TSMC shares climbed as investors bet on earnings and technology exports.",
    Category.MARKETS,
    countryLocked,
  );
  assert.equal(classified.accepted, true);
  const scores = calculateScores({
    text: "Taiwan semiconductor exports rise on AI chip demand TSMC shares climbed as investors bet on earnings and technology exports.",
    relevance: classified.relevance,
    sourceQuality: 78,
    publishedAt: new Date(),
  });
  assert.equal(shouldStoreArticle(classified, scores), true);
});

test("rejects weak generic market hits that previously passed via countryLocked", () => {
  const classified = classifyArticle(
    "Local business owners gather for brunch",
    "Growth remains a talking point among members.",
    Category.MARKETS,
    { countryLocked: true },
  );
  assert.equal(classified.weakMarketOnly, true);
  assert.equal(classified.accepted, false);
});

test("countryLocked no longer bypasses zero-signal local stories", () => {
  const classified = classifyArticle(
    "City council announces park renovation plans",
    "Residents welcomed the new green space opening next month.",
    Category.MARKETS,
    { countryLocked: true },
  );
  assert.equal(classified.accepted, false);
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

test("country catalog covers the global & regional market set", () => {
  const codes = COUNTRY_CATALOG.map((item) => item.code);
  assert.ok(COUNTRY_CATALOG.length >= 78, `catalog shrank to ${COUNTRY_CATALOG.length}`);
  assert.equal(new Set(codes).size, COUNTRY_CATALOG.length);
  assert.ok(COUNTRY_CATALOG.every((item) => item.code.length === 2));
  assert.ok(COUNTRY_CATALOG.some((item) => item.code === "DE" && !item.community));
  assert.ok(COUNTRY_CATALOG.some((item) => item.code === "AE" && item.community));
  const supported = supportedCountryCodes();
  assert.ok(supported.includes("DE"));
  assert.ok(supported.includes("QA"));
  assert.ok(supported.includes("EU"));
  assert.ok(supported.length >= 80);
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

test("high-priority investor sources use relaxed store thresholds", () => {
  const classified = {
    accepted: true,
    relevance: 22,
    weakMarketOnly: false,
  };
  const scores = { marketImpact: 10, finalScore: 30 };
  assert.equal(shouldStoreArticle(classified, scores), false);
  assert.equal(
    shouldStoreArticle(classified, scores, {
      sourceQuality: 96,
      defaultCategory: Category.OIL,
      sourceCountry: "KW",
    }),
    true,
  );
});

test("audience chips follow Kuwait-first Gulf editorial order", () => {
  const sorted = sortAudienceCodesByEditorialOrder(["QA", "PH", "KW", "SA", "AE"]);
  assert.deepEqual(sorted, ["KW", "SA", "AE", "QA", "PH"]);
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
