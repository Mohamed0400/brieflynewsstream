import assert from "node:assert/strict";
import test from "node:test";
import {
  isPublicAdminGate,
  isPublicConsoleApi,
  isPublicConsolePage,
  skipsMiddlewareAuthRefresh,
} from "./console-public-routes";

test("public console pages skip middleware auth refresh", () => {
  assert.equal(isPublicConsolePage("/console/login"), true);
  assert.equal(isPublicConsolePage("/console/signup"), true);
  assert.equal(isPublicConsolePage("/console/reset-password"), true);
  assert.equal(isPublicConsolePage("/console/overview"), false);
});

test("public console session API skips middleware auth refresh", () => {
  assert.equal(isPublicConsoleApi("/api/console/session"), true);
  assert.equal(isPublicConsoleApi("/api/console/session/bridge"), true);
  assert.equal(isPublicConsoleApi("/api/console/account"), false);
});

test("auth confirm and error routes skip middleware auth refresh", () => {
  assert.equal(skipsMiddlewareAuthRefresh("/auth/confirm"), true);
  assert.equal(skipsMiddlewareAuthRefresh("/auth/callback"), true);
  assert.equal(skipsMiddlewareAuthRefresh("/auth/error"), true);
});

test("admin sign-in gate skips middleware auth refresh", () => {
  assert.equal(isPublicAdminGate("/consoleofbrieflynewsstreamapi"), true);
  assert.equal(isPublicAdminGate("/consoleofbrieflynewsstreamapi/operations"), false);
  assert.equal(skipsMiddlewareAuthRefresh("/consoleofbrieflynewsstreamapi"), true);
  assert.equal(skipsMiddlewareAuthRefresh("/consoleofbrieflynewsstreamapi/operations"), false);
});
