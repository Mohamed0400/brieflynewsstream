import { runArchiveAndPrune } from "@/lib/archive/export";
import { prisma } from "@/lib/prisma";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const noPrune = process.argv.includes("--no-prune");
  const result = await runArchiveAndPrune({ dryRun, prune: !noPrune });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok && !result.skipped) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
