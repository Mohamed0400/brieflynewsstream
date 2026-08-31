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

/** Upsert Arabic-only pipeline sources without touching main-pipeline rows. */
export async function syncArabicLiveSources(sources: CountrySourceSeed[]) {
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
          sourceLocale: "ar",
          collectPipeline: "arabic",
          enabled: true,
        },
      })),
    );
  }
}

export async function disableRetiredCountrySources() {
  for (const code of RETIRED_COUNTRY_SOURCE_CODES) {
    await prisma.source.updateMany({
      where: { code },
      data: { enabled: false },
    });
  }
}
