/**
 * CLI for GitHub Actions / ops hosts.
 * Clears zombie locks and abandons stale raw so collect can claim the job.
 *
 * Flags:
 *   --force-locks          Release every running job lock (pre-collect)
 *   --collect-if-stale     Start collect when last run failed or feed is old
 *   --no-translate         Skip bounded translation drain
 *   --pre-collect          Shorthand: force-locks + no collect + no translate
 */
import { prisma } from "../lib/prisma";
import { runOpsAutoHeal } from "../lib/ops-recovery";

async function main() {
  const argv = process.argv.slice(2);
  const preCollect = argv.includes("--pre-collect");
  const forceLocks = preCollect || argv.includes("--force-locks");
  const triggerCollectIfStale = !preCollect && argv.includes("--collect-if-stale");
  const translate = !preCollect && !argv.includes("--no-translate");

  const result = await runOpsAutoHeal({
    forceEnabled: true,
    forceLocks,
    translate,
    triggerCollectIfStale,
    actorId: "system:gha-ops-heal",
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.disabled) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
