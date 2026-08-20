/**
 * One-time cutover: copy all rows from local SQLite into Supabase Postgres.
 * Preserves IDs so relations stay intact. Idempotent via upsert / skipDuplicates.
 *
 * Usage:
 *   npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * Requires:
 *   SQLITE_BACKUP_URL=file:./data/live.db  (relative to prisma/)
 *   DATABASE_URL + DIRECT_URL pointing at Supabase
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SQLITE_REL =
  process.env.SQLITE_BACKUP_URL?.replace(/^file:/, "") || "./data/live.db";
const SQLITE_PATH = path.resolve(process.cwd(), "prisma", SQLITE_REL);

type Row = Record<string, unknown>;

function sqliteJson(sql: string): Row[] {
  const raw = execFileSync("sqlite3", ["-json", SQLITE_PATH, sql], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
  if (!raw) return [];
  return JSON.parse(raw) as Row[];
}

function sqliteCount(table: string): number {
  const rows = sqliteJson(`SELECT COUNT(*) AS c FROM "${table}"`);
  return Number(rows[0]?.c ?? 0);
}

function asBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return String(value) === "1" || String(value).toLowerCase() === "true";
}

function asDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    // SQLite may store ms epoch or seconds
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asDateRequired(value: unknown, fallback = new Date()): Date {
  return asDate(value) ?? fallback;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function upsertMany(
  label: string,
  rows: Row[],
  insert: (batch: Row[]) => Promise<unknown>,
) {
  console.log(`→ ${label}: ${rows.length} rows`);
  for (const batch of chunk(rows, 250)) {
    await insert(batch);
  }
}

const BOOTSTRAP_ACCOUNT_ID = "bootstrap_super_admin_cutover";

async function ensureBootstrapAccount() {
  await prisma.account.upsert({
    where: { id: BOOTSTRAP_ACCOUNT_ID },
    create: {
      id: BOOTSTRAP_ACCOUNT_ID,
      authUserId: "local-sqlite-cutover",
      email: "bootstrap@briefly.local",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      plan: "FREE",
    },
    update: {},
  });
}

async function migrateSources() {
  const rows = sqliteJson("SELECT * FROM Source");
  await upsertMany("Source", rows, async (batch) => {
    await prisma.source.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        code: String(r.code),
        name: String(r.name),
        url: String(r.url),
        homepageUrl: r.homepageUrl == null ? null : String(r.homepageUrl),
        adapter: String(r.adapter ?? "rss"),
        country: String(r.country),
        region: r.region as "MIDDLE_EAST" | "AMERICA" | "GLOBAL",
        defaultCategory: (r.defaultCategory as never) ?? null,
        qualityWeight: Number(r.qualityWeight ?? 70),
        enabled: asBool(r.enabled),
        lastFetchedAt: asDate(r.lastFetchedAt),
        lastError: r.lastError == null ? null : String(r.lastError),
        createdAt: asDateRequired(r.createdAt),
        updatedAt: asDateRequired(r.updatedAt),
      })),
      skipDuplicates: true,
    });
  });
}

async function migrateRawArticles() {
  const rows = sqliteJson("SELECT * FROM RawArticle");
  await upsertMany("RawArticle", rows, async (batch) => {
    await prisma.rawArticle.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        sourceId: String(r.sourceId),
        externalId: String(r.externalId),
        title: String(r.title),
        url: String(r.url),
        summary: r.summary == null ? null : String(r.summary),
        publisher: r.publisher == null ? null : String(r.publisher),
        audienceCodes: String(r.audienceCodes ?? ""),
        imageUrl: r.imageUrl == null ? null : String(r.imageUrl),
        publishedAt: asDateRequired(r.publishedAt),
        rawJson: String(r.rawJson ?? "{}"),
        processedAt: asDate(r.processedAt),
        createdAt: asDateRequired(r.createdAt),
      })),
      skipDuplicates: true,
    });
  });
}

async function migrateArticles() {
  const rows = sqliteJson("SELECT * FROM Article");
  await upsertMany("Article", rows, async (batch) => {
    await prisma.article.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        sourceId: String(r.sourceId),
        title: String(r.title),
        summary: String(r.summary ?? ""),
        displayTitle: r.displayTitle == null ? null : String(r.displayTitle),
        displaySummary: r.displaySummary == null ? null : String(r.displaySummary),
        titleEn: r.titleEn == null ? null : String(r.titleEn),
        summaryEn: r.summaryEn == null ? null : String(r.summaryEn),
        titleAr: r.titleAr == null ? null : String(r.titleAr),
        summaryAr: r.summaryAr == null ? null : String(r.summaryAr),
        translatedAt: asDate(r.translatedAt),
        editorializedAt: asDate(r.editorializedAt),
        publisher: r.publisher == null ? null : String(r.publisher),
        audienceCodes: String(r.audienceCodes ?? ""),
        url: String(r.url),
        imageUrl: r.imageUrl == null ? null : String(r.imageUrl),
        category: r.category as never,
        secondaryTags: String(r.secondaryTags ?? ""),
        country: String(r.country),
        region: r.region as "MIDDLE_EAST" | "AMERICA" | "GLOBAL",
        language: String(r.language ?? "en"),
        publishedAt: asDateRequired(r.publishedAt),
        contentHash: String(r.contentHash),
        storyKey: String(r.storyKey ?? ""),
        createdAt: asDateRequired(r.createdAt),
        updatedAt: asDateRequired(r.updatedAt),
      })),
      skipDuplicates: true,
    });
  });
}

async function migrateArticleScores() {
  const rows = sqliteJson("SELECT * FROM ArticleScore");
  await upsertMany("ArticleScore", rows, async (batch) => {
    await prisma.articleScore.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        articleId: String(r.articleId),
        relevance: Number(r.relevance),
        freshness: Number(r.freshness),
        sourceQuality: Number(r.sourceQuality),
        goldImpact: Number(r.goldImpact),
        usdImpact: Number(r.usdImpact),
        ratesImpact: Number(r.ratesImpact),
        oilImpact: Number(r.oilImpact),
        middleEastImpact: Number(r.middleEastImpact),
        marketImpact: Number(r.marketImpact),
        finalScore: Number(r.finalScore),
        explanation: String(r.explanation ?? ""),
        createdAt: asDateRequired(r.createdAt),
        updatedAt: asDateRequired(r.updatedAt),
      })),
      skipDuplicates: true,
    });
  });
}

async function migrateEditions() {
  const editions = sqliteJson("SELECT * FROM DailyEdition");
  await upsertMany("DailyEdition", editions, async (batch) => {
    await prisma.dailyEdition.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        date: String(r.date),
        status: (r.status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
        locked: asBool(r.locked),
        itemCount: Number(r.itemCount ?? 0),
        summary: r.summary == null ? null : String(r.summary),
        createdAt: asDateRequired(r.createdAt),
        updatedAt: asDateRequired(r.updatedAt),
      })),
      skipDuplicates: true,
    });
  });

  const items = sqliteJson("SELECT * FROM DailyEditionItem");
  await upsertMany("DailyEditionItem", items, async (batch) => {
    await prisma.dailyEditionItem.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        editionId: String(r.editionId),
        articleId: String(r.articleId),
        rank: Number(r.rank),
        section: String(r.section),
      })),
      skipDuplicates: true,
    });
  });
}

async function migrateApiKeysAndRequests() {
  await ensureBootstrapAccount();
  const keys = sqliteJson("SELECT * FROM ApiKey");
  await upsertMany("ApiKey", keys, async (batch) => {
    await prisma.apiKey.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        accountId: BOOTSTRAP_ACCOUNT_ID,
        name: String(r.name),
        prefix: String(r.prefix),
        keyHash: String(r.keyHash),
        lastFour: String(r.lastFour),
        lastUsedAt: asDate(r.lastUsedAt),
        revokedAt: asDate(r.revokedAt),
        createdAt: asDateRequired(r.createdAt),
        updatedAt: asDateRequired(r.updatedAt),
      })),
      skipDuplicates: true,
    });
  });

  const requests = sqliteJson("SELECT * FROM ApiRequest");
  await upsertMany("ApiRequest", requests, async (batch) => {
    await prisma.apiRequest.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        apiKeyId: r.apiKeyId == null ? null : String(r.apiKeyId),
        endpoint: String(r.endpoint),
        method: String(r.method),
        pointsUsed: Number(r.pointsUsed ?? 1),
        requestedAt: asDateRequired(r.requestedAt),
      })),
      skipDuplicates: true,
    });
  });
}

async function migrateScheduler() {
  const jobs = sqliteJson("SELECT * FROM ScheduledJob");
  await upsertMany("ScheduledJob", jobs, async (batch) => {
    await prisma.scheduledJob.createMany({
      data: batch.map((r) => ({
        id: String(r.id),
        key: String(r.key),
        name: String(r.name),
        description: String(r.description ?? ""),
        cron: String(r.cron),
        timezone: String(r.timezone),
        enabled: asBool(r.enabled),
        lastRunAt: asDate(r.lastRunAt),
        lastStatus: r.lastStatus == null ? null : String(r.lastStatus),
        lastError: r.lastError == null ? null : String(r.lastError),
        lastSummary: r.lastSummary == null ? null : String(r.lastSummary),
        lockedUntil: asDate(r.lockedUntil),
        createdAt: asDateRequired(r.createdAt),
        updatedAt: asDateRequired(r.updatedAt),
      })),
      skipDuplicates: true,
    });
  });

  const beats = sqliteJson("SELECT * FROM SchedulerHeartbeat");
  await upsertMany("SchedulerHeartbeat", beats, async (batch) => {
    for (const r of batch) {
      await prisma.schedulerHeartbeat.upsert({
        where: { id: String(r.id) },
        create: {
          id: String(r.id),
          processName: String(r.processName),
          lastTickAt: asDateRequired(r.lastTickAt),
        },
        update: {
          processName: String(r.processName),
          lastTickAt: asDateRequired(r.lastTickAt),
        },
      });
    }
  });
}

async function verify() {
  const tables = [
    "Source",
    "RawArticle",
    "Article",
    "ArticleScore",
    "DailyEdition",
    "DailyEditionItem",
    "ApiKey",
    "ApiRequest",
    "ScheduledJob",
    "SchedulerHeartbeat",
  ] as const;

  const pgCounts: Record<string, number> = {
    Source: await prisma.source.count(),
    RawArticle: await prisma.rawArticle.count(),
    Article: await prisma.article.count(),
    ArticleScore: await prisma.articleScore.count(),
    DailyEdition: await prisma.dailyEdition.count(),
    DailyEditionItem: await prisma.dailyEditionItem.count(),
    ApiKey: await prisma.apiKey.count(),
    ApiRequest: await prisma.apiRequest.count(),
    ScheduledJob: await prisma.scheduledJob.count(),
    SchedulerHeartbeat: await prisma.schedulerHeartbeat.count(),
  };

  console.log("\n=== Cutover verification ===");
  let ok = true;
  for (const table of tables) {
    const sqlite = sqliteCount(table);
    const pg = pgCounts[table];
    const match = sqlite === pg ? "OK" : "MISMATCH";
    if (sqlite !== pg) ok = false;
    console.log(`${match.padEnd(9)} ${table}: sqlite=${sqlite}  postgres=${pg}`);
  }
  if (!ok) {
    throw new Error("Row-count mismatch — investigate before deleting SQLite backup.");
  }
  console.log("All table counts match.");
}

async function main() {
  if (!existsSync(SQLITE_PATH)) {
    throw new Error(`SQLite backup not found at ${SQLITE_PATH}`);
  }

  const stamped = path.join(
    path.dirname(SQLITE_PATH),
    `backup-pre-supabase-${new Date().toISOString().slice(0, 10)}.db`,
  );
  if (!existsSync(stamped)) {
    copyFileSync(SQLITE_PATH, stamped);
    console.log(`Backup copied to ${stamped}`);
  }

  console.log(`Migrating from ${SQLITE_PATH} → Supabase Postgres`);
  await migrateSources();
  await migrateRawArticles();
  await migrateArticles();
  await migrateArticleScores();
  await migrateEditions();
  await migrateApiKeysAndRequests();
  await migrateScheduler();
  await verify();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
