import { prisma } from "../lib/prisma";
import { runPipeline } from "../lib/pipeline";

async function main() {
  const result = await runPipeline({
    forceEdition: true,
    skipCollect: true,
    skipTranslation: process.argv.includes("--skip-translation"),
  });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
