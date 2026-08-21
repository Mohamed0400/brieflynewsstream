import assert from "node:assert/strict";
import test from "node:test";
import {
  PUBLIC_SERVER_ERROR,
  isInternalError,
  publicErrorMessage,
} from "./public-error";

test("database host and Prisma internals stay off the public message", () => {
  const prisma = new Error(
    'Invalid `prisma.article.findMany()` invocation\nCan\'t reach database server at `aws-0-ap-northeast-1.pooler.supabase.com:6543`',
  );
  assert.equal(isInternalError(prisma), true);
  const message = publicErrorMessage(prisma, PUBLIC_SERVER_ERROR);
  assert.equal(message, PUBLIC_SERVER_ERROR);
  assert.doesNotMatch(message, /supabase|6543|findMany|prisma|aws-0/i);
});

test("short validation errors remain visible", () => {
  assert.equal(publicErrorMessage(new Error("date must be YYYY-MM-DD")), "date must be YYYY-MM-DD");
  assert.equal(publicErrorMessage("Unknown scheduled job."), "Unknown scheduled job.");
});

test("local stack paths do not mark a validation error as internal", () => {
  assert.equal(isInternalError(new Error("date must be YYYY-MM-DD")), false);
});
