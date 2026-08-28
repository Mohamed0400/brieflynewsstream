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
  /** Max items kept from generated Google News RSS feeds. */
  googleNewsRss: intEnv("COLLECT_GNEWS_LIMIT", 12),
  /** Parallel RSS/HTML fetches per collect run. */
  collectConcurrency: Math.max(1, intEnv("COLLECT_CONCURRENCY", 4)),
  /**
   * Wall-clock budget for starting source fetches (collectAll + fillThinCountries).
   * 0 = no deadline. Default 40 minutes so a GitHub job can finish normalize/edition.
   */
  collectBudgetMs: intEnv("COLLECT_BUDGET_MS", 2_400_000),
  /** Skip sources fetched (ok or error) within this many hours (unless forced). */
  collectRefreshHours: Math.max(1, intEnv("COLLECT_REFRESH_HOURS", 4)),
  /** Minimum live articles each catalog country should hold in the freshness window. */
  minCountryArticles: Math.max(1, intEnv("MIN_COUNTRY_ARTICLES", 3)),
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
  /** Max raw articles normalized per pipeline pass. 0 = all pending in one pass. */
  normalizeBatch: intEnv("NORMALIZE_BATCH_SIZE", 2500),
  /** Max normalize passes per collect run (each pass takes normalizeBatch rows). */
  normalizePasses: Math.max(1, intEnv("NORMALIZE_PASSES", 8)),
  /**
   * Extra normalize passes when a rawArticle backlog exists (processedAt is null).
   * 32 passes × 2500 batch ≈ 80k rows per recovery-oriented run.
   */
  normalizeBacklogPasses: Math.max(1, intEnv("NORMALIZE_BACKLOG_PASSES", 32)),
  /**
   * Normalize passes before RSS fetch. Keep this small so a huge backlog cannot
   * burn the whole GitHub job before sources are refreshed.
   */
  normalizePreCollectPasses: Math.max(0, intEnv("NORMALIZE_PRE_COLLECT_PASSES", 1)),
  /** Candidate pool size before daily ranking. 0 = all scored articles in window. */
  dailyCandidates: intEnv("DAILY_CANDIDATE_POOL", 0),
  /** Published daily edition size (Top N). */
  dailyEdition: intEnv("DAILY_EDITION_SIZE", 20),
  /** Soft max items per region in the daily mix. 0 = no region cap. */
  dailyRegionCap: intEnv("DAILY_REGION_CAP", 0),
  /** Default page size for filterable API. */
  apiDefault: intEnv("API_DEFAULT_LIMIT", 50),
  /** Absolute max page size for filterable API. */
  apiMax: intEnv("API_MAX_LIMIT", 500),
  /** Homepage feed page size (paginated). */
  dashboard: intEnv("DASHBOARD_LIMIT", 50),
  /** Max articles scanned for deduped homepage/API feeds (must cover the freshness window). */
  feedDedupeMaxScan: intEnv("FEED_DEDUPE_MAX_SCAN", 5000),
  /** Max articles translated per pipeline or translate job run. 0 = all pending. */
  translateBatch: intEnv("TRANSLATE_BATCH_SIZE", 80),
  /** Articles per Gemini translation request. */
  translateItemBatch: Math.max(1, intEnv("TRANSLATE_ITEM_BATCH_SIZE", 12)),
  /** Parallel Gemini translation requests per direction. */
  translateConcurrency: Math.max(1, intEnv("TRANSLATE_CONCURRENCY", 4)),
  /** Max translate drain loops per collect or translate job. */
  translateMaxPasses: Math.max(1, intEnv("TRANSLATE_MAX_PASSES", 25)),
  /** Editions list page size default. */
  editionsList: intEnv("EDITIONS_LIST_LIMIT", 90),
};
