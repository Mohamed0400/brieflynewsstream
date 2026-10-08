import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  freeQuotaExceededBody,
  isQuotaExceeded,
  quotaResponseHeaders,
  type QuotaWindow,
} from "./api-quota";
import { getMaintenanceStatus } from "./maintenance";
import {
  resolvePlanLimits,
  utcDayWindow,
  utcMonthWindow,
  utcYearWindow,
} from "./plans";
import { prisma } from "./prisma";

export function secureMatches(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function hashApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function issueApiKeySecret() {
  const environment = process.env.NEXT_PUBLIC_APP_ENV === "live" ? "live" : "test";
  const prefix = `mna_${environment}_`;
  const plaintext = `${prefix}${randomBytes(24).toString("base64url")}`;
  return {
    prefix,
    plaintext,
    lastFour: plaintext.slice(-4),
    keyHash: hashApiKey(plaintext),
  };
}

export async function createApiKey(name: string, accountId: string) {
  const issued = issueApiKeySecret();
  const record = await prisma.apiKey.create({
    data: {
      accountId,
      name: name.trim().slice(0, 80) || "Default key",
      prefix: issued.prefix,
      keyHash: issued.keyHash,
      lastFour: issued.lastFour,
    },
  });
  return { plaintext: issued.plaintext, record };
}

export async function rotateApiKey(id: string) {
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return { error: "not_found" as const };
  if (existing.revokedAt) return { error: "revoked" as const };
  const issued = issueApiKeySecret();
  const record = await prisma.apiKey.update({
    where: { id },
    data: {
      prefix: issued.prefix,
      keyHash: issued.keyHash,
      lastFour: issued.lastFour,
      lastUsedAt: null,
    },
  });
  return { plaintext: issued.plaintext, record };
}

export async function requireApiKey(request: Request) {
  const provided = request.headers.get("x-api-key");
  let apiKeyId: string | null = null;
  let accountId: string | null = null;
  let plan = "FREE";
  const freeDefaults = resolvePlanLimits({ plan: "FREE" });
  let dailyLimit = freeDefaults.dailyRequests;
  let monthlyLimit: number | null = freeDefaults.monthlyRequests;
  let yearlyLimit: number | null = freeDefaults.yearlyRequests;
  let usedToday = 0;
  let usedMonth = 0;
  let usedYear = 0;

  const envKeyOk = secureMatches(provided, process.env.API_KEY);

  if (!envKeyOk) {
    if (!provided) {
      return NextResponse.json(
        { error: "unauthorized", message: "Provide a valid X-API-Key header." },
        { status: 401 },
      );
    }
    const stored = await prisma.apiKey.findFirst({
      where: { keyHash: hashApiKey(provided), revokedAt: null },
      select: {
        id: true,
        accountId: true,
        account: {
          select: {
            id: true,
            plan: true,
            status: true,
            dailyPointsOverride: true,
            maxKeysOverride: true,
          },
        },
      },
    });
    if (!stored) {
      return NextResponse.json(
        { error: "unauthorized", message: "Provide a valid X-API-Key header." },
        { status: 401 },
      );
    }
    if (stored.account.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "account_suspended", message: "This account is suspended." },
        { status: 403 },
      );
    }
    if (stored.account.status === "CLOSED") {
      return NextResponse.json(
        { error: "account_closed", message: "This account has been closed." },
        { status: 403 },
      );
    }

    const maintenance = await getMaintenanceStatus();
    if (maintenance.apiActive) {
      return NextResponse.json(
        {
          error: "maintenance",
          message: maintenance.apiMessage,
          scheduled_at: maintenance.scheduledAt,
          status: "unavailable",
        },
        {
          status: 503,
          headers: {
            "Retry-After": "3600",
            "X-Maintenance-Mode": "active",
          },
        },
      );
    }

    apiKeyId = stored.id;
    accountId = stored.accountId;
    plan = stored.account.plan;
    const limits = resolvePlanLimits({
      plan: stored.account.plan,
      dailyPointsOverride: stored.account.dailyPointsOverride,
      maxKeysOverride: stored.account.maxKeysOverride,
    });
    dailyLimit = limits.dailyRequests;
    monthlyLimit = limits.monthlyRequests;
    yearlyLimit = limits.yearlyRequests;

    const day = utcDayWindow();
    const month = utcMonthWindow();
    const year = utcYearWindow();
    const accountFilter = { apiKey: { accountId: stored.accountId } };
    const [dayCount, monthCount, yearCount] = await Promise.all([
      prisma.apiRequest.count({
        where: { ...accountFilter, requestedAt: { gte: day.start, lt: day.end } },
      }),
      monthlyLimit != null
        ? prisma.apiRequest.count({
            where: { ...accountFilter, requestedAt: { gte: month.start, lt: month.end } },
          })
        : Promise.resolve(0),
      yearlyLimit != null
        ? prisma.apiRequest.count({
            where: { ...accountFilter, requestedAt: { gte: year.start, lt: year.end } },
          })
        : Promise.resolve(0),
    ]);
    usedToday = dayCount;
    usedMonth = monthCount;
    usedYear = yearCount;

    let exceeded: QuotaWindow | null = null;
    if (yearlyLimit != null && isQuotaExceeded(usedYear, yearlyLimit)) exceeded = "year";
    else if (monthlyLimit != null && isQuotaExceeded(usedMonth, monthlyLimit)) exceeded = "month";
    else if (isQuotaExceeded(usedToday, dailyLimit)) exceeded = "day";

    if (exceeded) {
      const headers = quotaResponseHeaders({
        plan,
        usedToday,
        dailyLimit,
        usedMonth,
        monthlyLimit,
        usedYear,
        yearlyLimit,
      });
      if (plan === "FREE" && monthlyLimit != null && yearlyLimit != null) {
        return NextResponse.json(
          freeQuotaExceededBody({
            plan,
            window: exceeded,
            usedToday,
            dailyLimit,
            usedMonth,
            monthlyLimit,
            usedYear,
            yearlyLimit,
          }),
          { status: 429, headers },
        );
      }
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: "API request quota exceeded for this plan.",
          plan,
          window: exceeded,
          limit: dailyLimit,
          used: usedToday,
        },
        { status: 429, headers },
      );
    }
  } else {
    plan = "ENV";
    dailyLimit = Number.MAX_SAFE_INTEGER;
    monthlyLimit = null;
    yearlyLimit = null;
  }

  const endpoint = new URL(request.url).pathname;
  try {
    await prisma.$transaction([
      prisma.apiRequest.create({
        data: {
          apiKeyId,
          endpoint,
          method: request.method,
        },
      }),
      ...(apiKeyId
        ? [
            prisma.apiKey.update({
              where: { id: apiKeyId },
              data: { lastUsedAt: new Date() },
            }),
          ]
        : []),
    ]);
    if (accountId) {
      usedToday += 1;
      usedMonth += 1;
      usedYear += 1;
    }
  } catch (error) {
    console.error("Failed to record API usage", error);
  }

  // Attach quota headers via a pass-through marker on the request is not possible;
  // callers that need headers should use applyQuotaHeaders on their response.
  const headers = quotaResponseHeaders({
    plan,
    usedToday,
    dailyLimit,
    usedMonth,
    monthlyLimit,
    usedYear,
    yearlyLimit,
  });
  (request as Request & { __quotaHeaders?: Record<string, string> }).__quotaHeaders = headers;
  return null;
}

export function takeQuotaHeaders(request: Request): Record<string, string> | undefined {
  return (request as Request & { __quotaHeaders?: Record<string, string> }).__quotaHeaders;
}

export function withQuotaHeaders(request: Request, response: NextResponse) {
  const headers = takeQuotaHeaders(request);
  if (!headers) return response;
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function requireAdminKey(request: Request) {
  if (secureMatches(request.headers.get("x-api-key"), process.env.ADMIN_API_KEY)) return null;
  return NextResponse.json(
    { error: "unauthorized", message: "Provide the admin key in X-API-Key." },
    { status: 401 },
  );
}
