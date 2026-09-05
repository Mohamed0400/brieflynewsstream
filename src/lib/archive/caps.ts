/**
 * Neon Free self-healing size caps.
 * Age retention runs first; these count caps are a backstop so ingest spikes
 * cannot push the free project past ~0.5 GB storage.
 *
 * Soft floor: never delete articles newer than ARCHIVE_COUNT_CAP_MIN_AGE_HOURS
 * (default 36h) even when over the row cap.
 */

function intEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

/** Max Article rows kept on Free. 0 = disable count cap (age retention only). */
export function articleCountCap() {
  const raw = intEnv("ARCHIVE_ARTICLE_COUNT_CAP", 20_000);
  if (raw <= 0) return 0;
  return Math.min(200_000, raw);
}

/** Max RawArticle rows (any status). 0 = disable. */
export function rawArticleCountCap() {
  const raw = intEnv("ARCHIVE_RAW_COUNT_CAP", 25_000);
  if (raw <= 0) return 0;
  return Math.min(500_000, raw);
}

/**
 * Never delete articles published within this many hours, even when over cap.
 * Clamped to [24, 72] so the live feed edge stays intact.
 */
export function countCapMinAgeHours() {
  const raw = intEnv("ARCHIVE_COUNT_CAP_MIN_AGE_HOURS", 36);
  if (raw < 24) return 24;
  return Math.min(72, raw);
}

/** How many rows to delete to get back under cap (0 if already safe). */
export function excessOverCap(total: number, cap: number) {
  if (cap <= 0 || total <= cap) return 0;
  return total - cap;
}

/**
 * From oldest-first candidates, keep only those older than the soft floor.
 * Pure helper for tests + prune selection.
 */
export function filterOlderThanFloor<T extends { publishedAt: Date | string }>(
  rows: T[],
  floor: Date,
): T[] {
  const floorMs = floor.getTime();
  return rows.filter((row) => {
    const at = row.publishedAt instanceof Date
      ? row.publishedAt.getTime()
      : new Date(row.publishedAt).getTime();
    return Number.isFinite(at) && at < floorMs;
  });
}

export function countCapFloorDate(now = new Date(), minAgeHours = countCapMinAgeHours()) {
  return new Date(now.getTime() - minAgeHours * 60 * 60 * 1000);
}
