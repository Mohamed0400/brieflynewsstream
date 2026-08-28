import assert from "node:assert/strict";
import test from "node:test";
import {
  COUNTRY_CATALOG,
  catalogCountryCodes,
  countryRecord,
} from "./countries";
import {
  REGION_GROUP_META,
  groupCountryCodesByRegion,
  regionEditorialRank,
  regionGroupForCode,
  supportedCountryCodes,
} from "./supported-countries";

const CODE_PATTERN = /^[A-Z]{2}$/;
const SLUG_PATTERN = /^[a-z]+(?:-[a-z]+)*$/;

test("catalog codes are unique ISO 3166-1 alpha-2 values", () => {
  const codes = COUNTRY_CATALOG.map((item) => item.code);
  assert.equal(new Set(codes).size, codes.length, "duplicate country codes");
  for (const code of codes) {
    assert.match(code, CODE_PATTERN, `invalid ISO code: ${code}`);
  }
});

test("catalog slugs are unique and url-safe", () => {
  const slugs = COUNTRY_CATALOG.map((item) => item.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slugs");
  for (const slug of slugs) {
    assert.match(slug, SLUG_PATTERN, `invalid slug: ${slug}`);
  }
});

test("every record carries the fields the UI and API depend on", () => {
  for (const record of COUNTRY_CATALOG) {
    assert.ok(record.country.length > 0, `${record.code} missing English name`);
    assert.ok(record.nationality.length > 0, `${record.code} missing nationality`);
    assert.ok(record.flag.length > 0, `${record.code} missing flag`);
    assert.ok(record.nameAr.length > 0, `${record.code} missing Arabic name`);
    assert.ok(record.nationalityAr.length > 0, `${record.code} missing Arabic nationality`);
    assert.ok(Array.isArray(record.aliases), `${record.code} aliases not an array`);
  }
});

test("the full GCC is present", () => {
  const codes = new Set(catalogCountryCodes());
  for (const code of ["KW", "SA", "AE", "QA", "BH", "OM"]) {
    assert.ok(codes.has(code), `GCC country missing: ${code}`);
  }
});

test("Middle East and North Africa coverage is complete", () => {
  const codes = new Set(catalogCountryCodes());
  const mena = [
    // Levant + Gulf + wider Middle East
    "EG", "JO", "LB", "SY", "IQ", "IR", "IL", "PS", "TR", "YE",
    // North Africa
    "MA", "TN", "DZ", "LY", "SD",
    // Arab-League stragglers that used to be gaps
    "MR", "DJ", "SO", "KM",
  ];
  for (const code of mena) {
    assert.ok(codes.has(code), `MENA market missing: ${code}`);
  }
});

test("major global finance hubs are present", () => {
  const codes = new Set(catalogCountryCodes());
  for (const code of ["US", "GB", "DE", "JP", "CN", "HK", "SG", "IN", "ZA", "AU"]) {
    assert.ok(codes.has(code), `finance hub missing: ${code}`);
  }
});

test("countryRecord lookup is case and whitespace insensitive", () => {
  assert.equal(countryRecord(" kw ")?.code, "KW");
  assert.equal(countryRecord("Ae")?.code, "AE");
  assert.equal(countryRecord("ZZ"), undefined);
});

test("every catalog code maps to a browseable region group", () => {
  const globalOnly = new Set(["GLOBAL"]);
  for (const item of COUNTRY_CATALOG) {
    const group = regionGroupForCode(item.code);
    assert.ok(
      !globalOnly.has(item.code) ? group !== "global" : true,
      `${item.code} fell back to the global bucket`,
    );
    assert.ok(
      REGION_GROUP_META.some((meta) => meta.key === group),
      `${item.code} mapped to unknown region ${group}`,
    );
  }
});

test("region grouping preserves order, drops empty groups, and uses editorial member order", () => {
  const groups = groupCountryCodesByRegion(supportedCountryCodes(), "en");
  assert.ok(groups.length > 0, "expected at least one region group");

  const order = REGION_GROUP_META.map((meta) => meta.key);
  const seen = groups.map((group) => group.key);
  let cursor = -1;
  for (const key of seen) {
    const position = order.indexOf(key);
    assert.ok(position > cursor, `region ${key} is out of order`);
    cursor = position;
  }

  for (const group of groups) {
    assert.ok(group.items.length > 0, `${group.key} should not be empty`);
    const ranks = group.items.map((item) => regionEditorialRank(group.key, item.code));
    for (let index = 1; index < ranks.length; index += 1) {
      assert.ok(
        ranks[index] >= ranks[index - 1],
        `${group.key} members are not in editorial order at ${group.items[index]?.code}`,
      );
    }
  }

  const middleEast = groups.find((group) => group.key === "middle_east");
  assert.equal(middleEast?.items[0]?.code, "KW", "Middle East should lead with Kuwait");

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  assert.equal(total, supportedCountryCodes().length, "every code should land in a group");
});

test("EU and GLOBAL market extras are routed sensibly", () => {
  assert.equal(regionGroupForCode("EU"), "europe");
  assert.equal(regionGroupForCode("GLOBAL"), "global");
});
