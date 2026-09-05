import { Prisma } from "@prisma/client";
import { RETIRED_COUNTRY_SOURCE_CODES } from "./country-sources";
import type { CountrySourceSeed } from "./sources/types";
import { prisma } from "./prisma";

const BATCH_SIZE = 40;

type SourceSeed = Prisma.SourceCreateInput;

function toSourceSeed(source: CountrySourceSeed): SourceSeed {
  return {
    code: source.code,
    name: source.name,
    url: source.url,
    homepageUrl: source.homepageUrl,
    adapter: source.adapter,
    country: source.country,
    region: source.region,
    defaultCategory: source.defaultCategory,
    qualityWeight: source.qualityWeight,
    sourceLocale: source.sourceLocale ?? "en",
    collectPipeline: source.collectPipeline ?? "main",
    enabled: true,
  };
}

export async function upsertSourcesInBatches(sources: SourceSeed[]) {
  for (let index = 0; index < sources.length; index += BATCH_SIZE) {
    const batch = sources.slice(index, index + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((source) => prisma.source.upsert({
        where: { code: source.code },
        create: source,
        update: source,
      })),
    );
  }
}

export async function syncLiveCountrySources(sources: CountrySourceSeed[]) {
  for (let index = 0; index < sources.length; index += BATCH_SIZE) {
    const batch = sources.slice(index, index + BATCH_SIZE).map(toSourceSeed);
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
          sourceLocale: source.sourceLocale,
          collectPipeline: source.collectPipeline,
          enabled: true,
        },
      })),
    );
  }
  if (RETIRED_COUNTRY_SOURCE_CODES.length) {
    await prisma.source.updateMany({
      where: { code: { in: [...RETIRED_COUNTRY_SOURCE_CODES] } },
      data: { enabled: false },
    });
  }
}

/** Upsert Arabic-only pipeline sources; retag rows that already share the same RSS URL. */
export async function syncArabicLiveSources(sources: CountrySourceSeed[]) {
  let created = 0;
  let retagged = 0;
  let updated = 0;
  for (const raw of sources) {
    const seed = toSourceSeed(raw);
    seed.sourceLocale = "ar";
    seed.collectPipeline = "arabic";
    const existingByCode = await prisma.source.findUnique({ where: { code: seed.code } });
    const existingByUrl = await prisma.source.findUnique({ where: { url: seed.url } });
    if (existingByUrl && existingByUrl.code !== seed.code) {
      await prisma.source.update({
        where: { id: existingByUrl.id },
        data: {
          name: seed.name,
          homepageUrl: seed.homepageUrl,
          country: seed.country,
          region: seed.region,
          defaultCategory: seed.defaultCategory,
          qualityWeight: Math.max(existingByUrl.qualityWeight, raw.qualityWeight),
          sourceLocale: "ar",
          collectPipeline: "arabic",
          enabled: true,
        },
      });
      retagged += 1;
      continue;
    }
    if (existingByCode) {
      await prisma.source.update({
        where: { code: seed.code },
        data: {
          name: seed.name,
          url: seed.url,
          homepageUrl: seed.homepageUrl,
          adapter: seed.adapter,
          country: seed.country,
          region: seed.region,
          defaultCategory: seed.defaultCategory,
          qualityWeight: seed.qualityWeight,
          sourceLocale: "ar",
          collectPipeline: "arabic",
          enabled: true,
        },
      });
      updated += 1;
    } else {
      await prisma.source.create({ data: seed });
      created += 1;
    }
  }
  return { created, updated, retagged, total: sources.length };
}

export async function disableRetiredCountrySources() {
  for (const code of RETIRED_COUNTRY_SOURCE_CODES) {
    await prisma.source.updateMany({
      where: { code },
      data: { enabled: false },
    });
  }
}
