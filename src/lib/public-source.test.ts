import assert from "node:assert/strict";
import test from "node:test";
import { publicHomepageUrl, publicSourceName } from "./public-source";

test("public source names do not mention Google News", () => {
  assert.equal(publicSourceName("Google News Qatar Economy"), "Qatar Economy");
  assert.equal(publicSourceName("Google News KW Coverage Fill"), "KW");
  assert.equal(publicSourceName("Reuters"), "Reuters");
});

test("Google News homepages are omitted from public source records", () => {
  assert.equal(publicHomepageUrl("https://news.google.com/"), null);
  assert.equal(publicHomepageUrl("https://www.reuters.com/"), "https://www.reuters.com/");
});
