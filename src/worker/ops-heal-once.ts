/**
 * CLI for GitHub Actions / ops hosts.
 * Clears zombie locks and abandons stale raw so collect can claim the job.
 *
 * Flags:
 *   --force-locks          Release every running job lock (pre-collect)
 *   --collect-if-stale     Start collect when last run failed or feed is old
 *   --no-translate         Skip bounded translation drain
 *   --pre-collect          Shorthand: force-locks + stop translate/ops-heal + no collect + no translate
 *                          Use immediately before a full collect so a stuck/running translate
 *                          cannot block the run; translate runs again in the post-collect job.
 */
import { prisma } from "../lib/prisma";
import { runOpsAutoHeal } from "../lib/ops-recovery";
import { JOB_OPS_HEAL, JOB_TRANSLATE, releaseJobLock } from "../lib/scheduler";

async function main() {
  const argv = process.argv.slice(2);
  const preCollect = argv.includes("--pre-collect");
  const forceLocks = preCollect || argv.includes("--force-locks");
  const triggerCollectIfStale = !preCollect && argv.includes("--collect-if-stale");
  const translate = !preCollect && !argv.includes("--no-translate");

  // Explicitly stop translate (and ops-heal) before collect so a live/stuck
  // translate cannot hold the pipeline; post-collect GHA restarts translate.
  if (preCollect) {
    await releaseJobLock(JOB_TRANSLATE);
    await releaseJobLock(JOB_OPS_HEAL);
  }

  const result = await runOpsAutoHeal({
    forceEnabled: true,
    forceLocks,
    translate,
    triggerCollectIfStale,
    actorId: "system:gha-ops-heal",
  });

  if (preCollect) {
    result.messages.unshift(
      "Pre-collect: stopped translate/ops-heal locks so collect can start; translate will run after collect.",
    );
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.disabled) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
