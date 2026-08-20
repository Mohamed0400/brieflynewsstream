import { NextResponse } from "next/server";

/**
 * Edge-safe CORS helpers for middleware + API routes.
 * Keep this file free of node:crypto / Prisma / auth imports.
 */

export function apiCorsHeaders(origin?: string | null) {
  const allowed = process.env.API_CORS_ORIGIN?.trim();
  const value =
    allowed && allowed !== "*"
      ? origin && allowed.split(",").map((item) => item.trim()).includes(origin)
        ? origin
        : allowed.split(",")[0].trim()
      : allowed || "*";
  return {
    "Access-Control-Allow-Origin": value,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "X-API-Key, Content-Type, Accept",
    "Access-Control-Expose-Headers":
      "X-API-Quota-Limit, X-API-Quota-Remaining, X-API-Quota-Used, X-API-Plan, X-API-Version",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflightApi(origin?: string | null) {
  return new NextResponse(null, {
    status: 204,
    headers: apiCorsHeaders(origin),
  });
}
