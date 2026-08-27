import { requireApiKey } from "@/lib/auth";
import { listArchiveDays, queryArchiveDay } from "@/lib/archive/reader";
import { apiMeta, jsonApi } from "@/lib/api-response";
import { describeQueryFailure } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return jsonApi(null, { status: 204 }, request.headers.get("origin"));
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date")?.trim() || "";
    const lang = url.searchParams.get("lang") === "en" ? "en" : "ar";

    if (!date) {
      const listed = await listArchiveDays();
      return jsonApi({
        ...apiMeta({ lang, freshnessHours: null, deduplicated: true }),
        configured: listed.configured,
        days: listed.days,
        count: listed.days.length,
      }, {}, origin, request);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return jsonApi(
        { error: "invalid_query", message: "date must be YYYY-MM-DD" },
        { status: 400 },
        origin,
        request,
      );
    }

    const limit = Number(url.searchParams.get("limit") || "50");
    const offset = Number(url.searchParams.get("offset") || "0");
    const result = await queryArchiveDay({
      date,
      lang,
      q: url.searchParams.get("q") || undefined,
      country: url.searchParams.get("country") || undefined,
      category: url.searchParams.get("category") || undefined,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return jsonApi({
      ...apiMeta({ lang, freshnessHours: null, deduplicated: true }),
      configured: result.configured,
      date: result.date,
      total: result.total,
      count: result.items.length,
      items: result.items,
    }, {}, origin, request);
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
