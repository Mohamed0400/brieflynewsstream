import { API_TIMEZONE, API_VERSION, DEFAULT_API_LANG, jsonApi } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Market News API",
    description: "Arabic-first market news feed for GCC and global financial coverage. Send X-API-Key on every request except /health.",
    version: API_VERSION,
  },
  servers: [{ url: "/api/v1", description: "Current deployment" }],
  tags: [
    { name: "Feeds", description: "Market news articles" },
    { name: "Editions", description: "Daily ranked editions" },
    { name: "Meta", description: "Discovery helpers" },
    { name: "Operations", description: "Health and status" },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
        required: ["error", "message"],
      },
      ApiMeta: {
        type: "object",
        properties: {
          version: { type: "string" },
          lang: { type: "string", enum: ["ar", "en"], default: DEFAULT_API_LANG },
          timezone: { type: "string", example: API_TIMEZONE },
          freshnessHours: { type: "integer", nullable: true },
          deduplicated: { type: "boolean" },
        },
      },
      Article: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string", description: "Localized headline (Arabic by default)" },
          summary: { type: "string" },
          titleAr: { type: "string", nullable: true },
          titleEn: { type: "string", nullable: true },
          summaryAr: { type: "string", nullable: true },
          summaryEn: { type: "string", nullable: true },
          category: { type: "string" },
          country: { type: "string" },
          region: { type: "string" },
          url: { type: "string" },
          source: { type: "string" },
          publishedAt: { type: "string", format: "date-time" },
          translated: { type: "boolean" },
          scores: {
            type: "object",
            nullable: true,
            properties: {
              final: { type: "number" },
              relevance: { type: "number" },
              marketImpact: { type: "number" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Operations"],
        summary: "Service health, cron jobs, and bilingual coverage (no API key required)",
        description: "Use this after deploy. status is ok only when collect/translate/publish jobs exist and every fresh article has both Arabic and English fields.",
        responses: {
          "200": { description: "Healthy or scheduler-degraded; jobs exist and fresh articles are bilingual" },
          "503": { description: "Jobs missing/disabled, database down, or fresh articles missing ar/en fields" },
        },
      },
    },
    "/market-news": {
      get: {
        tags: ["Feeds"],
        summary: "Filterable market news feed",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Arabic or English search" },
          { name: "lang", in: "query", schema: { type: "string", enum: ["ar", "en"], default: DEFAULT_API_LANG }, description: "Response language" },
          { name: "language", in: "query", schema: { type: "string", enum: ["ar", "en"] }, description: "Filter by stored source language" },
          { name: "country", in: "query", schema: { type: "string" }, example: "KW" },
          { name: "region", in: "query", schema: { type: "string" }, example: "middle_east" },
          { name: "category", in: "query", schema: { type: "string" }, example: "gold" },
          { name: "nationality", in: "query", schema: { type: "string" }, example: "KW" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["score", "date"], default: "score" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 500 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": { description: "Paginated deduplicated articles with meta.lang" },
          "401": { description: "Missing or invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/market-news/nationality": {
      get: {
        tags: ["Feeds"],
        summary: "Community briefing by nationality audience",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: "nationality", in: "query", required: true, schema: { type: "string" }, example: "KW" },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "lang", in: "query", schema: { type: "string", enum: ["ar", "en"], default: DEFAULT_API_LANG } },
        ],
        responses: { "200": { description: "Briefing items with rotation metadata" } },
      },
    },
    "/market-news/today": {
      get: {
        tags: ["Editions"],
        summary: "Today's stored daily edition",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: "lang", in: "query", schema: { type: "string", enum: ["ar", "en"], default: DEFAULT_API_LANG } },
        ],
        responses: { "200": { description: "Edition payload" }, "404": { description: "Edition not published" } },
      },
    },
    "/meta/categories": {
      get: {
        tags: ["Meta"],
        summary: "Supported categories",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: "lang", in: "query", schema: { type: "string", enum: ["ar", "en"], default: DEFAULT_API_LANG } },
        ],
        responses: { "200": { description: "Category codes with localized labels" } },
      },
    },
  },
} as const;

export async function GET(request: Request) {
  return jsonApi(spec, undefined, request.headers.get("origin"));
}
