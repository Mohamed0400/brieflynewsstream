import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AuthTimeoutError,
  isAuthTimeoutError,
  withAuthRetry,
  withAuthTimeout,
} from "./auth-timeout";

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

describe("withAuthRetry", () => {
  it("retries once after a timeout", async () => {
    let attempts = 0;
    const value = await withAuthRetry(async () => {
      attempts += 1;
      if (attempts === 1) {
        await new Promise(() => {});
      }
      return "ok";
    }, 20, 1);
    assert.equal(value, "ok");
    assert.equal(attempts, 2);
  });
});

describe("isAuthTimeoutError", () => {
  it("detects AuthTimeoutError instances", () => {
    assert.equal(isAuthTimeoutError(new AuthTimeoutError()), true);
    assert.equal(isAuthTimeoutError(new Error("auth_timeout")), true);
    assert.equal(isAuthTimeoutError(new Error("network")), false);
  });
});
