import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { extractApiError } from "@/lib/api";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

const allowedParameters = new Set([
  "q",
  "searchIn",
  "category",
  "country",
  "region",
  "nationality",
  "source",
  "lang",
  "language",
  "from",
  "to",
  "sort",
  "limit",
  "offset",
]);

function hashApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const auth = await requireAccount();
  if ("response" in auth) return auth.response;
  if (auth.account.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "account_suspended", message: "This account is suspended." },
      { status: 403 },
    );
  }

  const incomingKey = request.headers.get("x-api-key")?.trim();
  if (!incomingKey) {
    return NextResponse.json(
      { error: "missing_key", message: "Provide one of your account API keys in X-API-Key." },
      { status: 400 },
    );
  }

  const owned = await prisma.apiKey.findFirst({
    where: {
      accountId: auth.account.id,
      keyHash: hashApiKey(incomingKey),
      revokedAt: null,
    },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json(
      {
        error: "invalid_key",
        message: "That key is not an active key on this signed-in account.",
      },
      { status: 403 },
    );
  }

  const incoming = new URL(request.url);
  const target = new URL("/api/v1/market-news", incoming.origin);
  for (const [name, value] of incoming.searchParams) {
    if (allowedParameters.has(name) && value) target.searchParams.append(name, value);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(target, {
      headers: { "X-API-Key": incomingKey },
      cache: "no-store",
    });
    const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
    const payload = await response.json().catch(() => ({
      error: "invalid_response",
      message: "The API returned a non-JSON response.",
    }));
    const message = response.ok ? null : extractApiError(payload);

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      durationMs,
      requestPath: `${target.pathname}${target.search}`,
      error: message,
      message,
      response: payload,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      status: 502,
      durationMs: Math.max(1, Math.round(performance.now() - startedAt)),
      requestPath: `${target.pathname}${target.search}`,
      error: "proxy_failed",
      message: error instanceof Error ? error.message : "The explorer could not reach the API.",
      response: null,
    }, { status: 502 });
  }
}
