import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_CATALOG } from "../countries";
import { buildPlatformOverviewPdf } from "./platform-overview-pdf";

test("platform overview PDF is a multi-page brief with impact and API docs", () => {
  const pdf = buildPlatformOverviewPdf();
  const text = pdf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.includes("/Count 5"));
  assert.ok(text.includes("PLATFORM BRIEF"));
  assert.ok(text.includes("Briefly NewsStream"));
  assert.ok(text.includes(`${COUNTRY_CATALOG.length}+ countries`));
  assert.ok(text.includes("MARKET IMPACT SCORING"));
  assert.ok(text.includes("What impact means"));
  assert.ok(text.includes("sort=score"));
  assert.ok(text.includes("X-API-Quota-Limit"));
  assert.ok(text.includes("/api/v1/market-news"));
  assert.ok(text.includes("www.brieflynewsstream.com"));
  assert.equal(text.includes("archive"), false);
  assert.equal(text.includes("Requests today"), false);
});
