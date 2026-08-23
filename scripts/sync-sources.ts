import { PrismaClient } from "@prisma/client";
import { allSources } from "../prisma/seed";
import { RETIRED_COUNTRY_SOURCE_CODES } from "../src/lib/country-sources";

const BATCH_SIZE = 25;
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is required");
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function main() {
  const byCode = new Map(allSources.map((source) => [source.code, source]));
  const sources = [...byCode.values()];
  console.log(`Upserting ${sources.length} sources via ${process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL"}...`);

  for (let index = 0; index < sources.length; index += BATCH_SIZE) {
    const batch = sources.slice(index, index + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((source) => prisma.source.upsert({
        where: { code: source.code },
        create: source,
        update: {
          name: source.name,
          url: source.url,
          homepageUrl: source.homepageUrl,
          adapter: source.adapter,
          country: source.country,
          region: source.region,
          defaultCategory: source.defaultCategory,
          qualityWeight: source.qualityWeight,
          enabled: true,
        },
      })),
    );
    if ((index / BATCH_SIZE) % 10 === 0 || index + BATCH_SIZE >= sources.length) {
      console.log(`Progress ${Math.min(index + BATCH_SIZE, sources.length)}/${sources.length}`);
    }
  }

  if (RETIRED_COUNTRY_SOURCE_CODES.length) {
    await prisma.source.updateMany({
      where: { code: { in: [...RETIRED_COUNTRY_SOURCE_CODES] } },
      data: { enabled: false },
    });
  }

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
  .finally(async () => {
    await prisma.$disconnect();
  });
