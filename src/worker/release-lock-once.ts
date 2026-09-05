/**
 * Mark a scheduled job interrupted if it is still "running".
 * Used by GHA `if: always()` cleanup after cancel/timeout (SIGTERM may not run).
 *
 * Usage:
 *   npx tsx src/worker/release-lock-once.ts collect-arabic
 *   npx tsx src/worker/release-lock-once.ts collect-arabic --force
 *
 * Without --force, only releases expired/zombie locks (safe if another workflow
 * holds a live heartbeat). With --force, releases any running claim for the key
 * (use only after this workflow's own collect step failed/cancelled).
 */
import { prisma } from "../lib/prisma";
import {
  JOB_COLLECT_ARABIC,
  releaseJobLock,
  shouldClearStaleLock,
} from "../lib/scheduler";

const args = process.argv.slice(2);
const force = args.includes("--force");
const key = args.find((a) => !a.startsWith("--"))?.trim() || JOB_COLLECT_ARABIC;

async function main() {
  const before = await prisma.scheduledJob.findUnique({
    where: { key },
    select: { key: true, lastStatus: true, lockedUntil: true, lastRunAt: true },
  });
  if (!before || before.lastStatus !== "running") {
    console.log(JSON.stringify({
      ok: true,
      key,
      released: false,
      lastStatus: before?.lastStatus ?? null,
      message: "No running lock to release.",
    }, null, 2));
    return;
  }

  const now = new Date();
  const stale = shouldClearStaleLock(before, now);
  if (!force && !stale) {
    console.log(JSON.stringify({
      ok: true,
      key,
      released: false,
      lastStatus: before.lastStatus,
      lockedUntil: before.lockedUntil?.toISOString() ?? null,
      message: "Live lock still heartbeating; left untouched (pass --force only after this run failed/cancelled).",
    }, null, 2));
    return;
  }

  await releaseJobLock(key);
  console.log(JSON.stringify({
    ok: true,
    key,
    released: true,
    force,
    stale,
    previousStatus: before.lastStatus,
    previousLockedUntil: before.lockedUntil?.toISOString() ?? null,
    message: `Released ${key} lock and marked interrupted.`,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
