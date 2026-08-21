import { tmpdir } from "node:os";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { RETIRED_COUNTRY_SOURCE_CODES } from "../src/lib/country-sources";
import { allSources } from "../prisma/seed";

const BATCH = 80;
const outDir = join(tmpdir(), "briefly-live-source-sql");
mkdirSync(outDir, { recursive: true });

type SeedRow = {
  code: string;
  name: string;
  url: string;
  homepageUrl?: string | null;
  adapter: string;
  country: string;
  region: string;
  defaultCategory?: string | null;
  qualityWeight: number;
};

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function batchSql(rows: SeedRow[]) {
  const json = JSON.stringify(rows.map((row) => ({
    code: row.code,
    name: row.name,
    url: row.url,
    homepageUrl: row.homepageUrl ?? null,
    adapter: row.adapter,
    country: row.country,
    region: row.region,
    defaultCategory: row.defaultCategory ?? null,
    qualityWeight: row.qualityWeight,
  })));
  return `
INSERT INTO "Source" (
  id, code, name, url, "homepageUrl", adapter, country, region,
  "defaultCategory", "qualityWeight", enabled, "createdAt", "updatedAt"
)
SELECT
  COALESCE(existing.id, 'c' || substr(md5(data.code), 1, 24)),
  data.code,
  data.name,
  data.url,
  data."homepageUrl",
  data.adapter,
  data.country,
  data.region::"Region",
  data."defaultCategory"::"Category",
  data."qualityWeight",
  true,
  COALESCE(existing."createdAt", NOW()),
  NOW()
FROM json_to_recordset(${sqlString(json)}::json) AS data(
  code text,
  name text,
  url text,
  "homepageUrl" text,
  adapter text,
  country text,
  region text,
  "defaultCategory" text,
  "qualityWeight" int
)
LEFT JOIN "Source" existing ON existing.code = data.code
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  "homepageUrl" = EXCLUDED."homepageUrl",
  adapter = EXCLUDED.adapter,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  "defaultCategory" = EXCLUDED."defaultCategory",
  "qualityWeight" = EXCLUDED."qualityWeight",
  enabled = true,
  "updatedAt" = NOW();
`.trim();
}

const files: string[] = [];
for (let i = 0; i < allSources.length; i += BATCH) {
  const chunk = allSources.slice(i, i + BATCH) as SeedRow[];
  const name = `batch-${String(Math.floor(i / BATCH) + 1).padStart(2, "0")}.sql`;
  const path = join(outDir, name);
  writeFileSync(path, batchSql(chunk));
  files.push(path);
}

const retired = [...RETIRED_COUNTRY_SOURCE_CODES].map(sqlString).join(", ");
const disablePath = join(outDir, "zz-disable-retired.sql");
writeFileSync(
  disablePath,
  `UPDATE "Source" SET enabled = false, "updatedAt" = NOW() WHERE code IN (${retired});`,
);
files.push(disablePath);

writeFileSync(
  join(outDir, "manifest.json"),
  JSON.stringify({ total: allSources.length, files: files.map((file) => file.split("/").at(-1)) }, null, 2),
);
console.log(JSON.stringify({ total: allSources.length, batches: files.length, outDir }));
