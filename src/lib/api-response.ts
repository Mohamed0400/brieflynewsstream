import { NextResponse } from "next/server";
import { takeQuotaHeaders } from "@/lib/auth";

export const API_VERSION = "1.0.0";
export const DEFAULT_API_LANG = "ar";
export const API_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kuwait";

export function apiCorsHeaders(origin?: string | null) {
  const allowed = process.env.API_CORS_ORIGIN?.trim();
  const value = allowed && allowed !== "*"
    ? (origin && allowed.split(",").map((item) => item.trim()).includes(origin) ? origin : allowed.split(",")[0].trim())
    : (allowed || "*");
  return {
    "Access-Control-Allow-Origin": value,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "X-API-Key, Content-Type, Accept",
    "Access-Control-Expose-Headers": "X-API-Quota-Limit, X-API-Quota-Remaining, X-API-Quota-Used, X-API-Plan, X-API-Version",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function jsonApi(
  body: unknown,
  init: ResponseInit = {},
  origin?: string | null,
  request?: Request,
) {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(apiCorsHeaders(origin))) {
    headers.set(name, value);
  }
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-API-Version", API_VERSION);
  if (request) {
    const quota = takeQuotaHeaders(request);
    if (quota) {
      for (const [name, value] of Object.entries(quota)) headers.set(name, value);
    }
  }
  return NextResponse.json(body, { ...init, headers });
}

export function apiMeta(input: {
  lang?: string;
  freshnessHours?: number | null;
  deduplicated?: boolean;
}) {
  return {
    version: API_VERSION,
    lang: input.lang === "en" ? "en" : DEFAULT_API_LANG,
    timezone: API_TIMEZONE,
    ...(input.freshnessHours != null ? { freshnessHours: input.freshnessHours } : {}),
    ...(input.deduplicated ? { deduplicated: true } : {}),
  };
}

export function preflightApi(origin?: string | null) {
  return new NextResponse(null, {
    status: 204,
    headers: apiCorsHeaders(origin),
  });
}
