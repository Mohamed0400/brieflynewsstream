import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth";
import {
  articleListOrderBy,
  countDedupedArticles,
  describeQueryFailure,
  fetchDedupedArticles,
  parseQuery,
  serializeArticles,
} from "@/lib/api";
import { apiMeta, jsonApi } from "@/lib/api-response";
import { limits } from "@/lib/limits";
import { expandSearchQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    if (!url.searchParams.getAll("nationality").some(Boolean)) {
      return NextResponse.json(
        {
          error: "invalid_query",
          message: "nationality is required; use an ISO code, slug, or AFRICA group",
        },
        { status: 400 },
      );
    }
    if (!url.searchParams.has("limit")) {
      url.searchParams.set("limit", String(Math.max(1, limits.nationalityFeed)));
    }
    const searchVariants = await expandSearchQuery(url.searchParams.get("q") ?? "");
    const query = parseQuery(url.searchParams, { searchVariants });
    const orderBy = [{ publishedAt: "desc" as const }, { score: { finalScore: "desc" as const } }];
    const [count, articles] = await Promise.all([
      countDedupedArticles(query.where, orderBy),
      fetchDedupedArticles(query.where, orderBy, query.limit, query.offset),
    ]);
    const displaySeconds = articles.length
      ? Math.min(20, Math.max(8, Math.floor(120 / articles.length)))
      : 0;

    return jsonApi({
      meta: apiMeta({
        lang: query.filters.lang,
        freshnessHours: Math.max(1, limits.nationalityMaxAgeHours),
        deduplicated: true,
      }),
      count,
      limit: query.limit,
      offset: query.offset,
      filters: query.filters,
      briefing: {
        targetDurationSeconds: 120,
        displaySecondsPerItem: displaySeconds,
        estimatedCycles: articles.length
          ? Math.ceil(120 / (articles.length * displaySeconds))
          : 0,
        freshnessHours: Math.max(1, limits.nationalityMaxAgeHours),
      },
      items: (await serializeArticles(articles, query.filters.lang, { ranked: true })).map((article) => ({
        ...article,
        displaySeconds,
      })),
    }, undefined, origin, request);
  } catch (error) {
    const failure = describeQueryFailure(error);
    return jsonApi(
      { error: failure.error, message: failure.message },
      { status: failure.status },
      origin,
      request,
    );
  }
}
