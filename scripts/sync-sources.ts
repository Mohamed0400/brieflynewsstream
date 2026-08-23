import { allSources, CORE_SEED_SOURCES } from "../prisma/seed";
import { prisma } from "../src/lib/prisma";
import { disableRetiredCountrySources, upsertSourcesInBatches } from "../src/lib/source-sync";

async function main() {
  const byCode = new Map(allSources.map((source) => [source.code, source]));
  for (const source of CORE_SEED_SOURCES) {
    byCode.set(source.code, source);
  }
  const sources = [...byCode.values()];
  console.log(`Upserting ${sources.length} sources...`);
  await upsertSourcesInBatches(sources);
  await disableRetiredCountrySources();
  const [total, enabled] = await Promise.all([
    prisma.source.count(),
    prisma.source.count({ where: { enabled: true } }),
  ]);
  console.log(JSON.stringify({ total, enabled }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
