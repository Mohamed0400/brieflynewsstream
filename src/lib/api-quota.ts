export const FREE_QUOTA_EXCEEDED_MESSAGE_EN = "No News Available! Renew";
export const FREE_QUOTA_EXCEEDED_MESSAGE_AR = "لا توجد أخبار متاحه. جدد الاشتراك";

export type QuotaWindow = "day" | "month" | "year";

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

export function quotaResponseHeaders(input: {
  plan: string;
  usedToday: number;
  dailyLimit: number;
  usedMonth?: number;
  monthlyLimit?: number | null;
  usedYear?: number;
  yearlyLimit?: number | null;
}) {
  const headers: Record<string, string> = {
    "X-API-Quota-Limit": String(input.dailyLimit),
    "X-API-Quota-Remaining": String(quotaRemaining(input.usedToday, input.dailyLimit)),
    "X-API-Quota-Used": String(input.usedToday),
    "X-API-Plan": input.plan,
  };
  if (input.monthlyLimit != null && input.usedMonth != null) {
    headers["X-API-Quota-Month-Limit"] = String(input.monthlyLimit);
    headers["X-API-Quota-Month-Used"] = String(input.usedMonth);
    headers["X-API-Quota-Month-Remaining"] = String(
      quotaRemaining(input.usedMonth, input.monthlyLimit),
    );
  }
  if (input.yearlyLimit != null && input.usedYear != null) {
    headers["X-API-Quota-Year-Limit"] = String(input.yearlyLimit);
    headers["X-API-Quota-Year-Used"] = String(input.usedYear);
    headers["X-API-Quota-Year-Remaining"] = String(
      quotaRemaining(input.usedYear, input.yearlyLimit),
    );
  }
  return headers;
}

export function freeQuotaExceededBody(input: {
  plan: string;
  window: QuotaWindow;
  usedToday: number;
  dailyLimit: number;
  usedMonth: number;
  monthlyLimit: number;
  usedYear: number;
  yearlyLimit: number;
}) {
  return {
    error: "quota_exceeded" as const,
    message: FREE_QUOTA_EXCEEDED_MESSAGE_EN,
    messageAr: FREE_QUOTA_EXCEEDED_MESSAGE_AR,
    items: [] as unknown[],
    plan: input.plan,
    window: input.window,
    limit: {
      day: input.dailyLimit,
      month: input.monthlyLimit,
      year: input.yearlyLimit,
    },
    used: {
      day: input.usedToday,
      month: input.usedMonth,
      year: input.usedYear,
    },
  };
}
