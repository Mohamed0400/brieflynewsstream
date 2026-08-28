import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTopEditionFeedView, newsFeedHref } from "./feed-view";

describe("isTopEditionFeedView", () => {
  it("defaults to top edition when no filters", () => {
    assert.equal(isTopEditionFeedView({}), true);
  });

  it("honors explicit view=top", () => {
    assert.equal(isTopEditionFeedView({ view: "top", country: "KW" }), true);
  });

  it("honors explicit view=all", () => {
    assert.equal(isTopEditionFeedView({ view: "all" }), false);
  });

  it("switches to full feed when filters are active", () => {
    assert.equal(isTopEditionFeedView({ category: "oil" }), false);
    assert.equal(isTopEditionFeedView({ country: "KW" }), false);
    assert.equal(isTopEditionFeedView({ q: "gold" }), false);
    assert.equal(isTopEditionFeedView({ sort: "date" }), false);
  });
});

describe("newsFeedHref", () => {
  it("builds top edition links with hash", () => {
    assert.equal(
      newsFeedHref({ lang: "en", view: "top", hash: "#homepage-feed" }),
      "/news?lang=en&view=top#homepage-feed",
    );
  });

  it("builds full feed links", () => {
    assert.equal(newsFeedHref({ view: "all" }), "/news?view=all");
  });
});
