import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthTimeoutError, isAuthTimeoutError, withAuthTimeout } from "./auth-timeout";

describe("withAuthTimeout", () => {
  it("resolves when the promise completes in time", async () => {
    const value = await withAuthTimeout(Promise.resolve("ok"), 100);
    assert.equal(value, "ok");
  });

  it("rejects when the promise exceeds the budget", async () => {
    await assert.rejects(
      () => withAuthTimeout(new Promise(() => {}), 20),
      AuthTimeoutError,
    );
  });
});

describe("isAuthTimeoutError", () => {
  it("detects AuthTimeoutError instances", () => {
    assert.equal(isAuthTimeoutError(new AuthTimeoutError()), true);
    assert.equal(isAuthTimeoutError(new Error("auth_timeout")), true);
    assert.equal(isAuthTimeoutError(new Error("network")), false);
  });
});
