export function quotaRemaining(used: number, limit: number) {
  return Math.max(0, limit - used);
}

export function isQuotaExceeded(used: number, limit: number) {
  return used >= limit;
}

export function canIssueApiKey(activeKeys: number, maxKeys: number) {
  return activeKeys < maxKeys;
}

export function quotaUsagePercent(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function quotaResponseHeaders(used: number, limit: number, plan: string) {
  return {
    "X-API-Quota-Limit": String(limit),
    "X-API-Quota-Remaining": String(quotaRemaining(used, limit)),
    "X-API-Quota-Used": String(used),
    "X-API-Plan": plan,
  };
}
