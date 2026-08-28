import assert from "node:assert/strict";
import test from "node:test";
import { E2E_QUOTA_KEY_NAME, e2eQuotaApiKeyPlaintext } from "./e2e-api-key";

test("e2e quota key defaults to a test-only mna_test secret", () => {
  const original = process.env.QUOTA_TEST_API_KEY;
  delete process.env.QUOTA_TEST_API_KEY;
  try {
    const plaintext = e2eQuotaApiKeyPlaintext();
    assert.match(plaintext, /^mna_test_/);
  } finally {
    if (original === undefined) delete process.env.QUOTA_TEST_API_KEY;
    else process.env.QUOTA_TEST_API_KEY = original;
  }
});

test("e2e quota key name is stable for provisioning scripts", () => {
  assert.equal(E2E_QUOTA_KEY_NAME, "E2E quota smoke");
});
