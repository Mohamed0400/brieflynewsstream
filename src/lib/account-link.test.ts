import assert from "node:assert/strict";
import test from "node:test";
import {
  planAccountLink,
  userFromNeonAuthData,
} from "./account-link";

test("planAccountLink creates when neither row exists", () => {
  assert.deepEqual(
    planAccountLink({
      authUserId: "neon-1",
      byAuthUserId: null,
      byEmailOldest: null,
    }),
    { action: "create" },
  );
});

test("planAccountLink uses existing authUserId match", () => {
  const byAuth = {
    id: "a1",
    authUserId: "neon-1",
    createdAt: new Date("2026-09-01"),
  };
  assert.deepEqual(
    planAccountLink({
      authUserId: "neon-1",
      byAuthUserId: byAuth,
      byEmailOldest: byAuth,
    }),
    { action: "use", accountId: "a1" },
  );
});

test("planAccountLink relinks email-only legacy supabase auth id", () => {
  assert.deepEqual(
    planAccountLink({
      authUserId: "neon-1",
      byAuthUserId: null,
      byEmailOldest: {
        id: "legacy",
        authUserId: "supabase-old",
        createdAt: new Date("2026-08-01"),
      },
    }),
    { action: "relink", accountId: "legacy" },
  );
});

test("planAccountLink merges duplicate neon row into older email account", () => {
  const plan = planAccountLink({
    authUserId: "neon-1",
    byAuthUserId: {
      id: "dup",
      authUserId: "neon-1",
      createdAt: new Date("2026-09-05"),
    },
    byEmailOldest: {
      id: "legacy",
      authUserId: "supabase-old",
      createdAt: new Date("2026-08-01"),
    },
  });
  assert.deepEqual(plan, {
    action: "relink",
    accountId: "legacy",
    releaseAuthUserIdFrom: "dup",
    deleteAccountId: "dup",
  });
});

test("userFromNeonAuthData reads Better Auth signIn payload", () => {
  const user = userFromNeonAuthData({
    user: { id: "u1", email: "a@b.com", emailVerified: true },
    token: "tok",
  });
  assert.equal(user?.id, "u1");
  assert.equal(user?.email, "a@b.com");
  assert.equal(userFromNeonAuthData(null), null);
  assert.equal(userFromNeonAuthData({}), null);
});
