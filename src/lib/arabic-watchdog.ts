import {
  isCurrentlyLocked,
  shouldRunStaleCollect,
  STALE_COLLECT_MAX_AGE_MS,
} from "./scheduler";

/**
 * Soft-heal threshold for Arabic desk freshness.
 * Between 3×/day slots (~6h), a missed/cancelled run should recover within this window
 * instead of waiting for the next scheduled collect (or overnight gap).
 */
export const STALE_ARABIC_FEED_MAX_AGE_MS = 5 * 60 * 60 * 1000;

export type ArabicWatchdogJob = {
  lastStatus: string | null;
  lastRunAt: Date | null;
  lockedUntil: Date | null;
};

export function ageMs(from: Date | null | undefined, now: Date) {
  if (from == null) return null;
  return Math.max(0, now.getTime() - from.getTime());
}

export function isArabicFeedStale(
  newestArabicCreatedAt: Date | null | undefined,
  now: Date,
  maxAgeMs: number = STALE_ARABIC_FEED_MAX_AGE_MS,
) {
  if (newestArabicCreatedAt == null) return true;
  const age = ageMs(newestArabicCreatedAt, now);
  return age != null && age >= maxAgeMs;
}

/**
 * Soft-heal decision: re-collect Arabic when the desk is stale or the last job
 * failed/aged out — but never while a live lock is held.
 * Does not touch MAIN collect (keep MAIN_COLLECT_ENABLED=false under egress pressure).
 */
export function shouldTriggerArabicFreshnessCollect(input: {
  now: Date;
  newestArabicCreatedAt: Date | null;
  job: ArabicWatchdogJob;
  maxAgeMs?: number;
}) {
  const maxAgeMs = input.maxAgeMs ?? STALE_ARABIC_FEED_MAX_AGE_MS;
  if (isCurrentlyLocked(input.job.lockedUntil, input.now)) return false;
  if (shouldRunStaleCollect(input.job, input.now, maxAgeMs)) return true;
  return isArabicFeedStale(input.newestArabicCreatedAt, input.now, maxAgeMs);
}

/** Re-export for callers that share the main-collect stale window. */
export { STALE_COLLECT_MAX_AGE_MS };
