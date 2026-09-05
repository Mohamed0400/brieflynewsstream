import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { gunzipSync, gzipSync } from "node:zlib";

export type ArchivedArticle = {
  id: string;
  title: string;
  summary: string;
  titleEn: string | null;
  summaryEn: string | null;
  titleAr: string | null;
  summaryAr: string | null;
  publisher: string | null;
  url: string;
  imageUrl: string | null;
  category: string;
  country: string;
  region: string;
  language: string;
  publishedAt: string;
  finalScore: number;
  sourceCode: string | null;
  sourceName: string | null;
  archivedAt: string;
};

export type ArchiveDayManifest = {
  date: string;
  articleCount: number;
  key: string;
  bytes: number;
  createdAt: string;
};

function requiredEnv(name: string) {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`${name}_missing`);
  return value;
}

export function archiveRetentionDays() {
  // Default 5 days keeps the free Supabase DB (~500 MB) under control without R2.
  const raw = Number(process.env.ARCHIVE_HOT_RETENTION_DAYS || "5");
  if (!Number.isFinite(raw) || raw < 1) return 5;
  return Math.min(30, Math.floor(raw));
}

/**
 * Processed RawArticle rows are egress/disk heavy (rawJson churn) and are not
 * needed after normalize. Keep them much shorter than Article hot retention.
 * Clamped to [1, archiveRetentionDays()] so raw never outlives articles.
 */
export function archiveRawRetentionDays() {
  const articleDays = archiveRetentionDays();
  const raw = Number(process.env.ARCHIVE_RAW_RETENTION_DAYS || "2");
  if (!Number.isFinite(raw) || raw < 1) return Math.min(2, articleDays);
  return Math.min(articleDays, Math.floor(raw));
}

export function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim()
      && process.env.R2_ACCESS_KEY_ID?.trim()
      && process.env.R2_SECRET_ACCESS_KEY?.trim()
      && process.env.R2_BUCKET_NAME?.trim(),
  );
}

export function r2BucketName() {
  return (process.env.R2_BUCKET_NAME || "briefly-newsstream-archive").trim();
}

let client: S3Client | null = null;

export function getR2Client() {
  if (client) return client;
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const endpoint = (process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`).trim();
  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return client;
}

export function dayObjectKey(date: string) {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) throw new Error("invalid_archive_date");
  return `articles/${y}/${m}/${d}.jsonl.gz`;
}

export function dayManifestKey(date: string) {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) throw new Error("invalid_archive_date");
  return `manifests/${y}/${m}/${d}.json`;
}

export const DAYS_INDEX_KEY = "index/days.json";

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === "string") return Buffer.from(body);
  const maybe = body as { transformToByteArray?: () => Promise<Uint8Array> };
  if (typeof maybe.transformToByteArray === "function") {
    return Buffer.from(await maybe.transformToByteArray());
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function putGzipJsonl(key: string, lines: string[]) {
  const payload = gzipSync(Buffer.from(`${lines.join("\n")}\n`, "utf8"));
  await getR2Client().send(new PutObjectCommand({
    Bucket: r2BucketName(),
    Key: key,
    Body: payload,
    ContentType: "application/gzip",
    ContentEncoding: "gzip",
    Metadata: { format: "jsonl", encoding: "gzip" },
  }));
  return payload.byteLength;
}

export async function putJson(key: string, value: unknown) {
  const body = Buffer.from(JSON.stringify(value, null, 2), "utf8");
  await getR2Client().send(new PutObjectCommand({
    Bucket: r2BucketName(),
    Key: key,
    Body: body,
    ContentType: "application/json; charset=utf-8",
  }));
  return body.byteLength;
}

export async function getObjectBuffer(key: string) {
  try {
    const result = await getR2Client().send(new GetObjectCommand({
      Bucket: r2BucketName(),
      Key: key,
    }));
    return await streamToBuffer(result.Body);
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    const message = error instanceof Error ? error.message : String(error);
    if (/NoSuchKey|NotFound|404/i.test(message)) return null;
    throw error;
  }
}

export async function readGzipJsonl(key: string): Promise<string[]> {
  const raw = await getObjectBuffer(key);
  if (!raw?.length) return [];
  const text = gunzipSync(raw).toString("utf8");
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

export async function readDayArticles(date: string): Promise<ArchivedArticle[]> {
  const lines = await readGzipJsonl(dayObjectKey(date));
  const items: ArchivedArticle[] = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line) as ArchivedArticle);
    } catch {
      // skip corrupt lines
    }
  }
  return items;
}

export async function readDaysIndex(): Promise<ArchiveDayManifest[]> {
  const raw = await getObjectBuffer(DAYS_INDEX_KEY);
  if (!raw?.length) return [];
  try {
    const parsed = JSON.parse(raw.toString("utf8")) as { days?: ArchiveDayManifest[] } | ArchiveDayManifest[];
    if (Array.isArray(parsed)) return parsed;
    return Array.isArray(parsed.days) ? parsed.days : [];
  } catch {
    return [];
  }
}

export async function writeDaysIndex(days: ArchiveDayManifest[]) {
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
  await putJson(DAYS_INDEX_KEY, { updatedAt: new Date().toISOString(), days: sorted });
  return sorted;
}

export async function listArchivePrefixes() {
  const result = await getR2Client().send(new ListObjectsV2Command({
    Bucket: r2BucketName(),
    Prefix: "articles/",
    MaxKeys: 1000,
  }));
  return (result.Contents || [])
    .map((row) => row.Key)
    .filter((key): key is string => Boolean(key));
}

export async function deleteObject(key: string) {
  await getR2Client().send(new DeleteObjectCommand({
    Bucket: r2BucketName(),
    Key: key,
  }));
}
