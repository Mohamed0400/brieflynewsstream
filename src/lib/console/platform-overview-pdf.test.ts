import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_CATALOG } from "../countries";
import { buildPlatformOverviewPdf } from "./platform-overview-pdf";

test("platform overview PDF is branded coverage, not usage or archive counts", () => {
  const pdf = buildPlatformOverviewPdf();
  const text = pdf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.includes("PLATFORM BRIEF"));
  assert.ok(text.includes("Briefly NewsStream platform"));
  assert.ok(text.includes(`About ${COUNTRY_CATALOG.length} countries`));
  assert.ok(text.includes("Arabic and English"));
  assert.ok(text.includes("/api/v1/market-news"));
  assert.ok(text.includes("www.brieflynewsstream.com"));
  assert.equal(text.includes("archive"), false);
  assert.equal(text.includes("RSS"), false);
  assert.equal(text.includes("Google News"), false);
  assert.equal(text.includes("Requests today"), false);
});
