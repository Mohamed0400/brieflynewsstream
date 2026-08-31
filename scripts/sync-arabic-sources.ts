import { arabicLiveSources } from "../src/lib/arabic-country-sources";
import { syncArabicLiveSources } from "../src/lib/source-sync";
import { prisma } from "../src/lib/prisma";

async function main() {
  const sources = arabicLiveSources();
  const result = await syncArabicLiveSources(sources);
  const enabled = await prisma.source.count({
    where: { collectPipeline: "arabic", enabled: true },
  });
  console.log(JSON.stringify({ catalog: sources.length, enabled, ...result }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
