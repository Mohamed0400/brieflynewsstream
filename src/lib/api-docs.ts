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
  { name: "q", type: "string", description: "Arabic or English search, including multi-word phrases such as أسعار النفط or oil prices." },
  { name: "searchIn", type: "title | summary | both", description: "Fields searched by q. Default both." },
  { name: "lang", type: "ar | en", description: "Response language for title and summary. Default ar. Does not filter the result set." },
  { name: "language", type: "ar | en", description: "Filter by the article's stored source language." },
  { name: "country", type: "string", description: "Host-market ISO code, comma-separated. With nationality, scopes community briefings to expats in that market. Example: SA,AE." },
  { name: "region", type: "middle_east | america | global", description: "Market region filter." },
  { name: "category", type: "string", description: "Catalog code such as finance, oil, commodities, or markets. See /api/v1/meta/categories." },
  { name: "nationality", type: "string", description: "Community audience ISO code, slug, or group such as AFRICA. Combine with country to filter expats in a host market. Repeatable." },
  { name: "source", type: "string", description: "Source identifier, comma-separated." },
  { name: "sort", type: "score | date", description: "score ranks by market impact. date is newest first. Default score." },
  { name: "date", type: "YYYY-MM-DD", description: "A single date. Overrides the default freshness window." },
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
        summary: "Send X-API-Key on every feed, edition, discovery, and source request. Create keys in this console.",
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
        summary: "Every article includes localized title and summary plus arabic and english objects. translated is true when both languages are present.",
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
    "category": "markets",
    "country": "US",
    "region": "global",
    "title": "البنوك المركزية تثبّت الفائدة مع استمرار التركيز على النفط",
    "summary": "تابع المتعاملون إشارات السياسة قبل الخطوة التالية في الطاقة والفائدة.",
    "arabic": {
      "title": "البنوك المركزية تثبّت الفائدة مع استمرار التركيز على النفط",
      "summary": "تابع المتعاملون إشارات السياسة قبل الخطوة التالية في الطاقة والفائدة."
    },
    "english": {
      "title": "Central banks hold rates as oil stays in focus",
      "summary": "Desks watch policy signals before the next move in energy and rates."
    },
    "translated": true,
    "url": "https://example.com/markets",
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
    hint: "Briefing articles",
    endpoints: [
      {
        id: "market-news",
        method: "GET",
        path: "/api/v1/market-news",
        title: "Filterable market news",
        summary: "Deduplicated market briefing. Default window is 72 hours unless date, from, or to is set. Arabic titles are the default.",
        auth: "api-key",
        query: feedQuery,
        curl: curlGet("/api/v1/market-news?q=oil&lang=ar&country=US&limit=20"),
        fetch: fetchGet("/api/v1/market-news?q=oil&lang=ar&country=US&limit=20"),
        response: `{
  "meta": { "version": "1.0.0", "lang": "ar", "timezone": "Asia/Kuwait", "freshnessHours": 72, "deduplicated": true },
  "count": 42,
  "limit": 20,
  "offset": 0,
  "filters": { "q": "oil", "lang": "ar", "country": "US", "sort": "score" },
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
        summary: "Community briefing for a nationality audience. nationality is required. Add country to scope expats in a host market (e.g. country=SA&nationality=PH). Default page size is 12 items in a 48-hour window.",
        auth: "api-key",
        query: [
          { name: "nationality", required: true, type: "string", description: "ISO code, slug, or group from /api/v1/meta/nationalities." },
          { name: "country", type: "string", description: "Host-market ISO code. Filters articles to that market context alongside nationality." },
          ...feedQuery.filter((param) => !["nationality", "country"].includes(param.name)),
        ],
        curl: curlGet("/api/v1/market-news/nationality?nationality=PH&country=SA&lang=ar"),
        fetch: fetchGet("/api/v1/market-news/nationality?nationality=PH&country=SA&lang=ar"),
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
        summary: "Stored Top N for today (default from DAILY_EDITION_SIZE, currently 20). Use limit to return fewer ranked items.",
        auth: "api-key",
        query: [
          { name: "lang", type: "ar | en", description: "Response language. Default ar." },
          { name: "limit", type: "integer", description: "Max ranked items to return. Default matches DAILY_EDITION_SIZE (20)." },
          { name: "offset", type: "integer", description: "Skip N ranked items. Default 0." },
          { name: "country", type: "ISO code", description: "Filter edition items by article country." },
          { name: "category", type: "category code", description: "Filter edition items by category." },
        ],
        curl: curlGet("/api/v1/market-news/today?lang=ar&limit=20"),
        fetch: fetchGet("/api/v1/market-news/today?lang=ar&limit=20"),
        response: `{
  "date": "2026-08-18",
  "count": 20,
  "total": 20,
  "limit": 20,
  "offset": 0,
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
        summary: "Stored daily edition for a date. Additional feed filters can narrow the ranked items.",
        auth: "api-key",
        query: [
          { name: "date", type: "YYYY-MM-DD", description: "Date. Defaults to today." },
          { name: "lang", type: "ar | en", description: "Response language. Default ar." },
          { name: "limit", type: "integer", description: "Max ranked items to return. Default matches DAILY_EDITION_SIZE (20)." },
          { name: "offset", type: "integer", description: "Skip N ranked items. Default 0." },
          { name: "country", type: "ISO code", description: "Filter edition items by article country." },
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
    label: "Catalog",
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
  "items": [{ "code": "markets", "label": "أخبار السوق المؤثرة", "labelEn": "Other market-moving news", "labelAr": "أخبار السوق المؤثرة" }]
}`,
        errors: [unauthorized],
      },
      {
        id: "countries",
        method: "GET",
        path: "/api/v1/meta/countries",
        title: "Countries",
        summary: "ISO country catalog (~70 markets) plus which codes currently have fresh articles in the default window. Community briefing audiences are a smaller nationality subset.",
        auth: "api-key",
        curl: curlGet("/api/v1/meta/countries"),
        fetch: fetchGet("/api/v1/meta/countries"),
        response: `{
  "freshnessHours": 72,
  "inFeedCount": 18,
  "supportedCount": 72,
  "items": [{ "code": "AE", "name": "United Arab Emirates", "nameAr": "الإمارات", "flag": "🇦🇪", "inFeed": true }]
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
        summary: "Enabled sources with healthy, stale, pending, or error status.",
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
    id: "admin",
    label: "Admin",
    hint: "Collect news and rebuild editions",
    endpoints: [
      {
        id: "cron-collect",
        method: "GET",
        path: "/api/cron/collect",
        title: "Cron: collect news",
        summary: "Called by Vercel Cron (07:00 Kuwait), cron-job.org (14:00), and GitHub Actions (22:00). Send CRON_SECRET as Bearer or ADMIN_API_KEY as X-API-Key.",
        auth: "admin",
        curl: `curl "${origin}/api/cron/collect" \\\n  -H "Authorization: Bearer $CRON_SECRET"`,
        fetch: `const res = await fetch("/api/cron/collect", {\n  headers: { Authorization: \`Bearer \${process.env.CRON_SECRET}\` },\n});\nconst data = await res.json();`,
        response: `{
  "ok": true,
  "skipped": false,
  "job": "collect",
  "message": "120 collected, 80 created, 40 translated, 15 in today's edition"
}`,
        errors: [
          { status: "401", code: "unauthorized", meaning: "CRON_SECRET or ADMIN_API_KEY was missing or did not match." },
        ],
      },
      {
        id: "collect",
        method: "POST",
        path: "/api/v1/admin/collect",
        title: "Run news collect",
        summary: "Administrator-only. Fetches every country source, fills markets below 3 stories, translates, and refreshes today's edition. GitHub Actions runs the long collect once daily.",
        auth: "admin",
        curl: `curl -X POST "${origin}/api/v1/admin/collect" \\\n  -H "X-API-Key: $ADMIN_API_KEY"`,
        fetch: `const res = await fetch("/api/v1/admin/collect", {\n  method: "POST",\n  headers: { "X-API-Key": process.env.ADMIN_API_KEY },\n});\nconst data = await res.json();`,
        response: `{
  "ok": true,
  "skipped": false,
  "message": "120 collected, 80 created, 40 translated, 15 in today's edition"
}`,
        errors: [
          { status: "401", code: "unauthorized", meaning: "ADMIN_API_KEY was missing or did not match." },
        ],
      },
      {
        id: "rebuild-edition",
        method: "POST",
        path: "/api/v1/admin/rebuild-edition",
        title: "Rebuild a daily edition",
        summary: "Administrator-only. Send the admin key, not a console API key. Use Schedule for routine collect and publish.",
        auth: "admin",
        body: [
          { name: "date", type: "YYYY-MM-DD", description: "Date. Defaults to today." },
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
