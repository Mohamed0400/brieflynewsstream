import assert from "node:assert/strict";
import test from "node:test";
import {
  isBlockedAccountStatus,
  isDuplicateSignupError,
  isDuplicateSignupUser,
} from "./console-signup-auth";

test("blocked account statuses", () => {
  assert.equal(isBlockedAccountStatus("SUSPENDED"), true);
  assert.equal(isBlockedAccountStatus("CLOSED"), true);
  assert.equal(isBlockedAccountStatus("ACTIVE"), false);
});

test("duplicate signup user has empty identities", () => {
  assert.equal(
    isDuplicateSignupUser({ identities: [] } as unknown as Parameters<typeof isDuplicateSignupUser>[0]),
    true,
  );
  assert.equal(
    isDuplicateSignupUser({ identities: [{ id: "1" }] } as unknown as Parameters<typeof isDuplicateSignupUser>[0]),
    false,
  );
});

test("duplicate signup error message", () => {
  assert.equal(isDuplicateSignupError("User already registered"), true);
  assert.equal(isDuplicateSignupError("Email already exists"), true);
  assert.equal(isDuplicateSignupError("Invalid login credentials"), false);
});
