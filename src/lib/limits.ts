function intEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return Math.floor(value);
}

/** 0 means no hard cap — take everything the source returns. */
export function applyLimit<T>(items: T[], limit: number): T[] {
  if (!limit || limit <= 0) return items;
  return items.slice(0, limit);
}

/**
 * Retrieval and output limits. Collection defaults are uncapped (0).
 * API/dashboard/edition sizes stay configurable so clients and screens can choose.
 */
export const limits = {
  /** Max items kept from one RSS feed. 0 = all. */
  rss: intEnv("COLLECT_RSS_LIMIT", 0),
  /** Max items kept from one HTML listing page. 0 = all. */
  html: intEnv("COLLECT_HTML_LIMIT", 0),
  /** Max items kept from one sitemap. 0 = all. */
  sitemap: intEnv("COLLECT_SITEMAP_LIMIT", 0),
  /** Max articles requested from Gemini Google Search grounding. */
  geminiSearch: intEnv("COLLECT_GEMINI_LIMIT", 50),
  /** Max fresh nationality-audience articles requested per grounded search. */
  nationalitySearch: intEnv("COLLECT_NATIONALITY_LIMIT", 60),
  /** Minimum hours between nationality grounded searches. */
  nationalitySearchIntervalHours: intEnv("NATIONALITY_SEARCH_INTERVAL_HOURS", 12),
  /** Default maximum age for current news feeds and daily editions. */
  newsMaxAgeHours: intEnv("NEWS_MAX_AGE_HOURS", 72),
  /** Maximum time since a successful fetch before a source is stale. */
  sourceHealthMaxAgeHours: intEnv("SOURCE_HEALTH_MAX_AGE_HOURS", 24),
  /** Maximum age of nationality feed articles. */
  nationalityMaxAgeHours: intEnv("NATIONALITY_NEWS_MAX_AGE_HOURS", 48),
  /** Default items in the two-minute nationality rotation. */
  nationalityFeed: intEnv("NATIONALITY_FEED_LIMIT", 12),
  /** Max raw articles normalized per pipeline run. 0 = all pending. */
  normalizeBatch: intEnv("NORMALIZE_BATCH_SIZE", 0),
  /** Candidate pool size before daily ranking. 0 = all scored articles in window. */
  dailyCandidates: intEnv("DAILY_CANDIDATE_POOL", 0),
  /** Published daily edition size (Top N). */
  dailyEdition: intEnv("DAILY_EDITION_SIZE", 15),
  /** Soft max items per region in the daily mix. 0 = no region cap. */
  dailyRegionCap: intEnv("DAILY_REGION_CAP", 0),
  /** Default page size for filterable API. */
  apiDefault: intEnv("API_DEFAULT_LIMIT", 50),
  /** Absolute max page size for filterable API. */
  apiMax: intEnv("API_MAX_LIMIT", 500),
  /** Homepage feed page size (paginated). */
  dashboard: intEnv("DASHBOARD_LIMIT", 50),
  /** Max articles translated per pipeline or translate job run. 0 = all pending. */
  translateBatch: intEnv("TRANSLATE_BATCH_SIZE", 40),
  /** Editions list page size default. */
  editionsList: intEnv("EDITIONS_LIST_LIMIT", 90),
};
