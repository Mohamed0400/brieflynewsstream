/** Hours between non-nationality Gemini grounded searches (unchanged from pipeline). */
export const GEMINI_SEARCH_INTERVAL_HOURS = 6;

export type CollectSourceSnapshot = {
  lastFetchedAt: Date | null;
  lastError?: string | null;
  adapter: string;
};

export type ShouldFetchOptions = {
  now?: number;
  forceCollect?: boolean;
  collectRefreshHours: number;
  nationalitySearchIntervalHours: number;
};

export function refreshIntervalHours(
  adapter: string,
  collectRefreshHours: number,
  nationalitySearchIntervalHours: number,
): number {
  if (adapter === "gemini-nationality-search") return nationalitySearchIntervalHours;
  if (adapter.startsWith("gemini")) return GEMINI_SEARCH_INTERVAL_HOURS;
  return collectRefreshHours;
}

/**
 * Decide whether this collect run should hit a source.
 * lastError is ignored: a failed fetch still writes lastFetchedAt, so we back off
 * instead of retrying every run (which burned the GitHub job on ~500 failing feeds).
 */
export function shouldFetchSource(
  source: CollectSourceSnapshot,
  options: ShouldFetchOptions,
): boolean {
  if (options.forceCollect) return true;
  if (!source.lastFetchedAt) return true;
  const now = options.now ?? Date.now();
  const intervalHours = refreshIntervalHours(
    source.adapter,
    options.collectRefreshHours,
    options.nationalitySearchIntervalHours,
  );
  return now - source.lastFetchedAt.getTime() >= intervalHours * 60 * 60 * 1000;
}

/** 0 budget means no deadline (local/dev). */
export function collectDeadline(now: number, budgetMs: number): number {
  if (budgetMs <= 0) return Number.POSITIVE_INFINITY;
  return now + budgetMs;
}

export function budgetRemainingMs(now: number, deadline: number): number {
  if (!Number.isFinite(deadline)) return Number.POSITIVE_INFINITY;
  return Math.max(0, deadline - now);
}

export function shouldStartAnotherFetch(now: number, deadline: number): boolean {
  return now < deadline;
}

export function compareSourcesByStaleness(
  a: { lastFetchedAt: Date | null },
  b: { lastFetchedAt: Date | null },
): number {
  const aStamp = a.lastFetchedAt ? a.lastFetchedAt.getTime() : Number.NEGATIVE_INFINITY;
  const bStamp = b.lastFetchedAt ? b.lastFetchedAt.getTime() : Number.NEGATIVE_INFINITY;
  return aStamp - bStamp;
}

/** Never-fetched and oldest lastFetchedAt first so a killed run plus the next covers the rest. */
export function sortSourcesOldestStaleFirst<T extends { lastFetchedAt: Date | null }>(
  sources: T[],
): T[] {
  return [...sources].sort(compareSourcesByStaleness);
}
