export type ApiParam = {
  name: string;
  required?: boolean;
  type: string;
  description: string;
};

export type ApiEndpoint = {
  id: string;
  method: "GET" | "POST";
  path: string;
  title: string;
  summary: string;
  auth: "none" | "api-key" | "admin";
  query?: ApiParam[];
  body?: ApiParam[];
  curl: string;
  fetch: string;
  response: string;
  errors: Array<{ status: string; code: string; meaning: string }>;
  explorerHref?: string;
};

export type ApiDocGroup = {
  id: string;
  label: string;
  hint: string;
  endpoints: ApiEndpoint[];
};

const keyHeader = `-H "X-API-Key: mna_test_your_key_here"`;
const origin = "http://localhost:3001";

const feedQuery: ApiParam[] = [
  { name: "q", type: "string", description: "Arabic or English search, including multi-word phrases such as ذهب الكويت." },
  { name: "searchIn", type: "title | summary | both", description: "Fields searched by q. Default both." },
  { name: "lang", type: "ar | en", description: "Response language for title and summary. Default ar. Does not filter the result set." },
  { name: "language", type: "ar | en", description: "Filter by the article's stored source language." },
  { name: "country", type: "string", description: "ISO country code, comma-separated. Example: KW,US." },
  { name: "region", type: "middle_east | america | global", description: "Market region filter." },
  { name: "category", type: "string", description: "gold, finance, economics, oil, me_economy, commodities, or markets." },
  { name: "nationality", type: "string", description: "Audience ISO code, slug, or group such as AFRICA. Repeatable." },
  { name: "source", type: "string", description: "Discovery source code, comma-separated." },
  { name: "sort", type: "score | date", description: "score ranks by market impact. date is newest first. Default score." },
  { name: "date", type: "YYYY-MM-DD", description: "Single Kuwait calendar day. Overrides the default freshness window." },
  { name: "from", type: "YYYY-MM-DD", description: "Inclusive published-at start date." },
  { name: "to", type: "YYYY-MM-DD", description: "Inclusive published-at end date." },
  { name: "limit", type: "integer", description: "Page size. Default 50, maximum 500." },
  { name: "offset", type: "integer", description: "Number of unique stories to skip. Default 0." },
];

const unauthorized = { status: "401", code: "unauthorized", meaning: "Missing or invalid X-API-Key header." };
const invalidQuery = { status: "400", code: "invalid_query", meaning: "A filter value was malformed or unknown." };

function curlGet(path: string, auth = true) {
  return `curl "${origin}${path}"${auth ? ` \\\n  ${keyHeader}` : ""}`;
}

function fetchGet(path: string, auth = true) {
  const headers = auth ? `,\n  headers: { "X-API-Key": "mna_test_your_key_here" }` : "";
  return `const res = await fetch("${path}"${headers});\nconst data = await res.json();`;
}

export const apiDocGroups: ApiDocGroup[] = [
  {
    id: "overview",
    label: "Overview",
    hint: "Auth, language, errors",
    endpoints: [
      {
        id: "authentication",
        method: "GET",
        path: "/api/v1/*",
        title: "Authentication",
        summary: "Send X-API-Key on every feed, edition, discovery, and source request. Create keys in this console. Health and OpenAPI stay public.",
        auth: "api-key",
        curl: `curl "${origin}/api/v1/market-news?limit=1" \\\n  ${keyHeader}`,
        fetch: fetchGet("/api/v1/market-news?limit=1"),
        response: `{
  "error": "unauthorized",
  "message": "Provide a valid X-API-Key header."
}`,
        errors: [
          unauthorized,
          { status: "204", code: "OPTIONS", meaning: "CORS preflight is accepted for GET and POST with X-API-Key." },
        ],
      },
      {
        id: "article-shape",
        method: "GET",
        path: "/api/v1/market-news",
        title: "Article payload",
        summary: "Every article includes localized title and summary plus stored Arabic and English fields. translated is true when both languages are present.",
        auth: "api-key",
        curl: curlGet("/api/v1/market-news?lang=ar&limit=1"),
        fetch: fetchGet("/api/v1/market-news?lang=ar&limit=1"),
        response: `{
  "meta": { "version": "1.0.0", "lang": "ar", "timezone": "Asia/Kuwait", "freshnessHours": 72, "deduplicated": true },
  "count": 128,
  "limit": 1,
  "offset": 0,
  "items": [{
    "id": "clxarticle01",
    "category": "gold",
    "country": "KW",
    "region": "middle_east",
    "title": "الذهب يرتفع مع ترقب بيانات التضخم",
    "summary": "ارتفعت أسعار الذهب مع ترقب المستثمرين لبيانات التضخم.",
    "titleAr": "الذهب يرتفع مع ترقب بيانات التضخم",
    "titleEn": "Gold rises ahead of inflation data",
    "translated": true,
    "url": "https://example.com/gold",
    "source": "Reuters",
    "publishedAt": "2026-08-18T08:12:00.000Z",
    "scores": { "final": 0.82, "relevance": 0.9, "marketImpact": 0.76 }
  }]
}`,
        errors: [unauthorized],
        explorerHref: "/console/explorer",
      },
    ],
  },
  {
    id: "feeds",
    label: "Feeds",
    hint: "Live articles",
    endpoints: [
      {
        id: "market-news",
        method: "GET",
        path: "/api/v1/market-news",
        title: "Filterable market news",
        summary: "Deduplicated live stream. Default window is 72 hours unless date, from, or to is set. Arabic titles are the default.",
        auth: "api-key",
        query: feedQuery,
        curl: curlGet("/api/v1/market-news?q=%D8%B0%D9%87%D8%A8&lang=ar&country=KW&limit=20"),
        fetch: fetchGet("/api/v1/market-news?q=ذهب&lang=ar&country=KW&limit=20"),
        response: `{
  "meta": { "version": "1.0.0", "lang": "ar", "timezone": "Asia/Kuwait", "freshnessHours": 72, "deduplicated": true },
  "count": 42,
  "limit": 20,
  "offset": 0,
  "filters": { "q": "ذهب", "lang": "ar", "country": "KW", "sort": "score" },
  "items": []
}`,
        errors: [unauthorized, invalidQuery],
        explorerHref: "/console/explorer",
      },
      {
        id: "nationality",
        method: "GET",
        path: "/api/v1/market-news/nationality",
        title: "Community briefing",
        summary: "Nationality audience rotation for Kuwait-facing coverage. nationality is required. Default page size is 12 items in a 48-hour window.",
        auth: "api-key",
        query: [
          { name: "nationality", required: true, type: "string", description: "ISO code, slug, or group from /api/v1/meta/nationalities." },
          ...feedQuery.filter((param) => param.name !== "nationality"),
        ],
        curl: curlGet("/api/v1/market-news/nationality?nationality=IN&lang=ar"),
        fetch: fetchGet("/api/v1/market-news/nationality?nationality=IN&lang=ar"),
        response: `{
  "meta": { "version": "1.0.0", "lang": "ar", "freshnessHours": 48, "deduplicated": true },
  "count": 12,
  "briefing": { "targetDurationSeconds": 120, "displaySecondsPerItem": 10, "estimatedCycles": 1 },
  "items": []
}`,
        errors: [
          unauthorized,
          { status: "400", code: "invalid_query", meaning: "nationality is missing or not in the supported audience list." },
        ],
      },
    ],
  },
  {
    id: "editions",
    label: "Editions",
    hint: "Daily ranked briefs",
    endpoints: [
      {
        id: "today",
        method: "GET",
        path: "/api/v1/market-news/today",
        title: "Today's edition",
        summary: "Stored Top 15 for the current Kuwait calendar day. Publish from Schedule if this returns 404.",
        auth: "api-key",
        query: [
          { name: "lang", type: "ar | en", description: "Response language. Default ar." },
        ],
        curl: curlGet("/api/v1/market-news/today?lang=ar"),
        fetch: fetchGet("/api/v1/market-news/today?lang=ar"),
        response: `{
  "date": "2026-08-18",
  "count": 15,
  "items": []
}`,
        errors: [
          unauthorized,
          { status: "404", code: "edition_not_ready", meaning: "Today's edition has not been published yet." },
        ],
      },
      {
        id: "daily",
        method: "GET",
        path: "/api/v1/market-news/daily",
        title: "Historical edition",
        summary: "Stored daily edition for a Kuwait calendar date. Additional feed filters can narrow the ranked items.",
        auth: "api-key",
        query: [
          { name: "date", type: "YYYY-MM-DD", description: "Kuwait calendar date. Defaults to today." },
          { name: "lang", type: "ar | en", description: "Response language. Default ar." },
        ],
        curl: curlGet("/api/v1/market-news/daily?date=2026-08-17&lang=en"),
        fetch: fetchGet("/api/v1/market-news/daily?date=2026-08-17&lang=en"),
        response: `{
  "date": "2026-08-17",
  "count": 15,
  "items": []
}`,
        errors: [
          unauthorized,
          invalidQuery,
          { status: "404", code: "edition_not_ready", meaning: "No stored edition exists for that date." },
        ],
      },
      {
        id: "editions",
        method: "GET",
        path: "/api/v1/market-news/editions",
        title: "Edition index",
        summary: "Lists recently published daily editions, newest first.",
        auth: "api-key",
        query: [
          { name: "limit", type: "integer", description: "How many dates to return. Default 30." },
        ],
        curl: curlGet("/api/v1/market-news/editions?limit=10"),
        fetch: fetchGet("/api/v1/market-news/editions?limit=10"),
        response: `{
  "count": 10,
  "items": [{ "date": "2026-08-18", "itemCount": 15 }]
}`,
        errors: [unauthorized],
      },
    ],
  },
  {
    id: "discovery",
    label: "Discovery",
    hint: "Filters and sources",
    endpoints: [
      {
        id: "categories",
        method: "GET",
        path: "/api/v1/meta/categories",
        title: "Categories",
        summary: "Supported market categories with Arabic and English labels.",
        auth: "api-key",
        query: [{ name: "lang", type: "ar | en", description: "Label language. Default ar." }],
        curl: curlGet("/api/v1/meta/categories?lang=ar"),
        fetch: fetchGet("/api/v1/meta/categories?lang=ar"),
        response: `{
  "meta": { "version": "1.0.0", "lang": "ar" },
  "items": [{ "code": "gold", "label": "الذهب والمعادن الثمينة", "labelEn": "Gold & precious metals", "labelAr": "الذهب والمعادن الثمينة" }]
}`,
        errors: [unauthorized],
      },
      {
        id: "countries",
        method: "GET",
        path: "/api/v1/meta/countries",
        title: "Countries",
        summary: "ISO country catalog (~70 markets) plus which codes currently have fresh articles in the default window. Community briefing audiences are a smaller Kuwait-facing subset.",
        auth: "api-key",
        curl: curlGet("/api/v1/meta/countries"),
        fetch: fetchGet("/api/v1/meta/countries"),
        response: `{
  "freshnessHours": 72,
  "inFeedCount": 18,
  "supportedCount": 72,
  "items": [{ "code": "KW", "name": "Kuwait", "nameAr": "الكويت", "flag": "🇰🇼", "inFeed": true }]
}`,
        errors: [unauthorized],
      },
      {
        id: "nationalities",
        method: "GET",
        path: "/api/v1/meta/nationalities",
        title: "Nationality audiences",
        summary: "Audience options and fresh coverage counts. This is not a demographic ranking.",
        auth: "api-key",
        curl: curlGet("/api/v1/meta/nationalities"),
        fetch: fetchGet("/api/v1/meta/nationalities"),
        response: `{
  "freshnessHours": 48,
  "ranking": false,
  "items": [{ "code": "IN", "nationality": "Indian", "country": "India", "freshArticleCount": 9 }],
  "groups": [{ "code": "AFRICA", "freshArticleCount": 14 }]
}`,
        errors: [unauthorized],
      },
      {
        id: "sources",
        method: "GET",
        path: "/api/v1/sources",
        title: "Source health",
        summary: "Enabled discovery sources with healthy, stale, pending, or error status.",
        auth: "api-key",
        curl: curlGet("/api/v1/sources"),
        fetch: fetchGet("/api/v1/sources"),
        response: `{
  "count": 40,
  "healthHours": 24,
  "items": [{ "code": "reuters", "name": "Reuters", "status": "healthy", "country": "GLOBAL" }]
}`,
        errors: [unauthorized],
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    hint: "Health and contract",
    endpoints: [
      {
        id: "health",
        method: "GET",
        path: "/api/v1/health",
        title: "Health",
        summary: "Public probe. ok only when collect, translate, and publish jobs exist and fresh articles have both Arabic and English fields.",
        auth: "none",
        curl: curlGet("/api/v1/health", false),
        fetch: fetchGet("/api/v1/health", false),
        response: `{
  "status": "ok",
  "ready": true,
  "service": "market-news-api",
  "checks": { "database": "ok", "scheduler": "online", "jobs": "ok", "bilingual": "ok" }
}`,
        errors: [
          { status: "503", code: "error", meaning: "Jobs missing, database down, or fresh articles missing ar/en fields." },
        ],
      },
      {
        id: "openapi",
        method: "GET",
        path: "/api/v1/openapi.json",
        title: "OpenAPI contract",
        summary: "Machine-readable OpenAPI 3 document for code generation and integration tests. No API key required.",
        auth: "none",
        curl: curlGet("/api/v1/openapi.json", false),
        fetch: fetchGet("/api/v1/openapi.json", false),
        response: `{
  "openapi": "3.0.3",
  "info": { "title": "Market News API", "version": "1.0.0" },
  "paths": { "/health": {}, "/market-news": {} }
}`,
        errors: [],
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    hint: "Rebuild editions",
    endpoints: [
      {
        id: "rebuild-edition",
        method: "POST",
        path: "/api/v1/admin/rebuild-edition",
        title: "Rebuild a daily edition",
        summary: "Administrator-only. Send the admin key, not a console API key. Use Schedule for routine collect and publish.",
        auth: "admin",
        body: [
          { name: "date", type: "YYYY-MM-DD", description: "Kuwait calendar date. Defaults to today." },
          { name: "force", type: "boolean", description: "Rebuild even if an edition already exists. Default true." },
        ],
        curl: `curl -X POST "${origin}/api/v1/admin/rebuild-edition" \\\n  -H "X-API-Key: $ADMIN_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"date":"2026-08-18","force":true}'`,
        fetch: `const res = await fetch("/api/v1/admin/rebuild-edition", {\n  method: "POST",\n  headers: {\n    "X-API-Key": process.env.ADMIN_API_KEY,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({ date: "2026-08-18", force: true }),\n});\nconst data = await res.json();`,
        response: `{
  "ok": true,
  "date": "2026-08-18",
  "itemCount": 15,
  "force": true
}`,
        errors: [
          { status: "401", code: "unauthorized", meaning: "ADMIN_API_KEY was missing or did not match." },
          invalidQuery,
        ],
      },
    ],
  },
];

export const apiDocExampleTabs = ["curl", "fetch", "response"] as const;
export type ApiDocExampleTab = (typeof apiDocExampleTabs)[number];

export function findApiDocGroup(id: string) {
  return apiDocGroups.find((group) => group.id === id) ?? apiDocGroups[0];
}

export function findApiDocEndpoint(groupId: string, endpointId: string) {
  const group = findApiDocGroup(groupId);
  return group.endpoints.find((endpoint) => endpoint.id === endpointId) ?? group.endpoints[0];
}
