import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTopEditionFeedView, newsFeedHref } from "./feed-view";

describe("isTopEditionFeedView", () => {
  it("defaults to full catalog when no view param", () => {
    assert.equal(isTopEditionFeedView({}), false);
  });

  it("honors explicit view=top even with filters", () => {
    assert.equal(isTopEditionFeedView({ view: "top" }), true);
    assert.equal(isTopEditionFeedView({ view: "top", country: "KW" }), true);
    assert.equal(isTopEditionFeedView({ view: "top", category: "oil", q: "gold" }), true);
  });

  it("uses full catalog for view=all and filtered views without view=top", () => {
    assert.equal(isTopEditionFeedView({ view: "all" }), false);
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
