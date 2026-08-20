import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { resolvePlanLimits, utcDayWindow } from "./plans";
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

function quotaHeaders(used: number, limit: number, plan: string) {
  const remaining = Math.max(0, limit - used);
  return {
    "X-API-Quota-Limit": String(limit),
    "X-API-Quota-Remaining": String(remaining),
    "X-API-Quota-Used": String(used),
    "X-API-Plan": plan,
  };
}

export async function requireApiKey(request: Request) {
  const provided = request.headers.get("x-api-key");
  let apiKeyId: string | null = null;
  let accountId: string | null = null;
  let plan = "FREE";
  let dailyLimit = resolvePlanLimits({ plan: "FREE" }).dailyRequests;
  let usedToday = 0;

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

    apiKeyId = stored.id;
    accountId = stored.accountId;
    plan = stored.account.plan;
    const limits = resolvePlanLimits({
      plan: stored.account.plan,
      dailyPointsOverride: stored.account.dailyPointsOverride,
      maxKeysOverride: stored.account.maxKeysOverride,
    });
    dailyLimit = limits.dailyRequests;

    const { start, end } = utcDayWindow();
    usedToday = await prisma.apiRequest.count({
      where: {
        apiKey: { accountId: stored.accountId },
        requestedAt: { gte: start, lt: end },
      },
    });

    if (usedToday >= dailyLimit) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: "Daily API request quota exceeded for this plan.",
          plan,
          limit: dailyLimit,
          used: usedToday,
        },
        {
          status: 429,
          headers: quotaHeaders(usedToday, dailyLimit, plan),
        },
      );
    }
  } else {
    plan = "ENV";
    dailyLimit = Number.MAX_SAFE_INTEGER;
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
    if (accountId) usedToday += 1;
  } catch (error) {
    console.error("Failed to record API usage", error);
  }

  // Attach quota headers via a pass-through marker on the request is not possible;
  // callers that need headers should use applyQuotaHeaders on their response.
  const headers = quotaHeaders(usedToday, dailyLimit, plan);
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
