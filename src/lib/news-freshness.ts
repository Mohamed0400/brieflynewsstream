import { limits } from "./limits";

export function newsFreshnessCutoff(now = new Date()) {
  return new Date(now.getTime() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000);
}

export function isWithinNewsFreshnessWindow(publishedAt: Date, now = new Date()) {
  return publishedAt.getTime() >= newsFreshnessCutoff(now).getTime();
}
