import assert from "node:assert/strict";
import test from "node:test";
import { consoleAuthCallbackUrl, safeAppPath } from "./auth-redirect";

test("confirmation next path rejects protocol-relative URLs", () => {
  assert.equal(safeAppPath("//evil.example"), "/console/overview");
});

test("confirmation next path keeps in-app routes", () => {
  assert.equal(safeAppPath("/console/reset-password"), "/console/reset-password");
});

test("confirmation links land on the app callback", () => {
  assert.equal(
    consoleAuthCallbackUrl("https://www.brieflynewsstream.com"),
    "https://www.brieflynewsstream.com/auth/confirm?next=%2Fconsole%2Foverview",
  );
});
