import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuery } from "./api";

function hasEditionFeedFilters(searchParams: URLSearchParams) {
  return Boolean(
    searchParams.get("q")?.trim()
    || searchParams.get("category")
    || searchParams.get("country")
    || searchParams.get("nationality")
    || searchParams.get("from")
    || searchParams.get("to")
    || searchParams.get("sort") === "date",
  );
}

describe("edition feed query", () => {
  it("skips default freshness when loading curated edition rows", () => {
    const params = new URLSearchParams({ sort: "score", limit: "15" });
    const live = parseQuery(params);
    const edition = parseQuery(params, { applyDefaultFreshness: false });
    assert.ok(live.where.publishedAt);
    assert.equal(edition.where.publishedAt, undefined);
  });
});

describe("hasEditionFeedFilters", () => {
  it("treats default top edition params as unfiltered", () => {
    assert.equal(hasEditionFeedFilters(new URLSearchParams({ sort: "score" })), false);
  });

  it("detects active feed filters", () => {
    assert.equal(hasEditionFeedFilters(new URLSearchParams({ country: "KW" })), true);
    assert.equal(hasEditionFeedFilters(new URLSearchParams({ q: "oil" })), true);
  });
});
