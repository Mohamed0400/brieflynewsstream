import { requireApiKey } from "@/lib/auth";
import { findArchivedArticleById } from "@/lib/archive/reader";
import { apiMeta, jsonApi } from "@/lib/api-response";
import { describeQueryFailure } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return jsonApi(null, { status: 204 }, request.headers.get("origin"));
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar";
    const article = await findArchivedArticleById(id, lang);
    if (!article) {
      return jsonApi(
        { error: "not_found", message: "Archived article not found." },
        { status: 404 },
        origin,
        request,
      );
    }
    return jsonApi({
      ...apiMeta({ lang, freshnessHours: null, deduplicated: true }),
      item: article,
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
