import assert from "node:assert/strict";
import { Category } from "@prisma/client";
import test from "node:test";
import { shouldKeepStoredArticle } from "./article-quality";

const taipeiSource = {
  defaultCategory: Category.MARKETS,
  sourceCountry: "TW",
  sourceAdapter: "rss",
  audienceCodes: null,
  sourceQuality: 70,
  publishedAt: new Date("2026-08-28T03:00:00.000Z"),
};

test("Taipei Times lifestyle rows fail the stored-article quality gate", () => {
  const junkTitles = [
    "Fun and games",
    "Storm warning issued",
    "Protect yourself from fraud",
    "The importance of a name change",
    "Fake listings warning",
  ];
  for (const title of junkTitles) {
    assert.equal(
      shouldKeepStoredArticle({ ...taipeiSource, title, summary: title }),
      false,
      `expected rejection for "${title}"`,
    );
  }
});

test("legitimate TW market news still passes the stored-article gate", () => {
  assert.equal(
    shouldKeepStoredArticle({
      ...taipeiSource,
      title: "Taiwan exports rise as semiconductor orders strengthen",
      summary: "Export orders climbed while chipmakers reported stronger bookings from global buyers.",
    }),
    true,
  );
});

test("nationality audience articles bypass the market gate", () => {
  assert.equal(
    shouldKeepStoredArticle({
      ...taipeiSource,
      sourceAdapter: "gemini-nationality-search",
      audienceCodes: "|PH|",
      title: "Community update",
      summary: "Local community event for Filipino workers.",
    }),
    true,
  );
});

test("sexual and vulgar headlines fail the stored-article gate", () => {
  assert.equal(
    shouldKeepStoredArticle({
      ...taipeiSource,
      title: "Celebrity sex scandal rocks tabloids",
      summary: "Affair details dominate entertainment pages.",
    }),
    false,
  );
});
