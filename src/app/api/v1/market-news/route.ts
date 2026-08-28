import { requireApiKey } from "@/lib/auth";
import {
  articleListOrderBy,
  describeQueryFailure,
  listDedupedArticles,
  parseQuery,
  serializeArticles,
} from "@/lib/api";
import { apiMeta, jsonApi } from "@/lib/api-response";
import { expandSearchQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const searchVariants = await expandSearchQuery(url.searchParams.get("q") ?? "");
    const query = parseQuery(url.searchParams, { searchVariants });
    const orderBy = articleListOrderBy(query.sort);
    const { count, items: articles } = await listDedupedArticles(
      query.where,
      orderBy,
      query.limit,
      query.offset,
      { lang: query.filters.lang, applyBriefRanking: query.applyBriefRanking },
    );
    return jsonApi({
      meta: apiMeta({
        lang: query.filters.lang,
        freshnessHours: query.filters.freshnessHours,
        deduplicated: true,
      }),
      count,
      limit: query.limit,
      offset: query.offset,
      filters: query.filters,
      items: await serializeArticles(articles, query.filters.lang),
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

export async function OPTIONS(request: Request) {
  return jsonApi(null, { status: 204 }, request.headers.get("origin"));
}
