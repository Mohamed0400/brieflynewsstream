import type { MarketingLang } from "@/lib/marketing-copy";
import { PLAN_DEFINITIONS, formatPlanCount } from "@/lib/plans";

const en = {
  crumb: "Developers",
  tocLabel: "Docs",
  tocStart: "Quick start",
  tocAuth: "Auth",
  tocNews: "Market News",
  tocFilters: "Filters",
  tocResponse: "Responses",
  tocErrors: "Errors",
  tocLimits: "Limits",
  heroTitle: "Market news API",
  heroLede:
    "JSON market news with clear filters, Arabic and English fields, and impact scores ready to use.",
  ctaKey: "Get an API key",
  ctaDocs: "See how it works",
  baseLabel: "Base URL",
  startTitle: "Start in 3 steps",
  start1Title: "Create an API key",
  start1Body: "Create your key in the developer console and send it with every request.",
  start2Title: "Send a request",
  start2Body: "Call GET /market-news with your key in the X-API-Key header.",
  start3Title: "Receive the data",
  start3Body: "Each story returns bilingual titles, a category, a market, and impact scores.",
  curlLabel: "Request",
  jsonLabel: "Response",
  newsTitle: "Market News API",
  newsPath: "GET /market-news",
  newsLede: "Fetch the latest stories with the filters your product needs.",
  paramsTitle: "Parameters",
  paramName: "Parameter",
  paramType: "Type",
  paramDesc: "Description",
  paramQ: "Arabic or English search, including multi-word phrases.",
  paramSearchIn: "title, summary, or both. Default both.",
  paramCountry: "ISO country code. Comma-separated. Example: US,AE.",
  paramRegion: "Market region. middle_east, america, or global.",
  paramCategory:
    "finance, economics, oil, me_economy, commodities, markets, or the precious-metals catalog code.",
  paramNationality: "Audience code. Required on /market-news/nationality. Example: IN.",
  paramLang: "Response language for title and summary. ar or en. Default ar.",
  paramLanguage: "Filter by the story's stored source language. ar or en.",
  paramSource: "Source identifier. Comma-separated.",
  paramSort: "score ranks by market impact. date is newest first. Default score.",
  paramDate: "A single date. YYYY-MM-DD. Overrides the default live window.",
  paramFrom: "Inclusive published-at start date. YYYY-MM-DD.",
  paramTo: "Inclusive published-at end date. YYYY-MM-DD.",
  paramLimit: "Page size. Default 50, maximum 500.",
  paramOffset: "Stories to skip. Default 0.",
  routesTitle: "Public endpoints",
  routePath: "Endpoint",
  routeNews: "Live filterable feed. Default 72-hour window.",
  routeToday: "Stored daily edition for today.",
  routeDaily: "Stored daily edition for a date.",
  routeEditions: "List of published edition dates.",
  routeNationality: "Community briefing. nationality is required.",
  routeCategories: "Category catalog with Arabic and English labels.",
  routeCountries: "Country catalog. About 70 ISO codes.",
  routeNationalities: "Audience codes for community briefings.",
  routeSources: "Sources available to your key.",
  exampleTitle: "Example",
  modelTitle: "Data built for code",
  modelLede: "Every story uses the same fields.",
  fieldTitle: "Title",
  fieldTitleBody: "title follows lang. arabic and english stay on the same object.",
  fieldCategory: "Category",
  fieldCategoryBody: "A fixed market category such as markets, finance, or oil.",
  fieldMarket: "Market",
  fieldMarketBody: "country is an ISO code. region is middle_east, america, or global.",
  fieldImpact: "Impact",
  fieldImpactBody: "scores.final and scores.marketImpact rank likely market effect.",
  fieldDate: "Date",
  fieldDateBody: "publishedAt is an ISO 8601 timestamp.",
  filtersTitle: "Filter news the way your product needs",
  filtersHint:
    "Use sort=score to rank stories by impact, not only by recency.",
  authTitle: "Authentication",
  authLede: "Send your API key in the X-API-Key header on every news request.",
  authHint: "Create keys in the developer console.",
  responseTitle: "Responses",
  responseLede:
    "JSON, UTF-8, Arabic and English fields, a stable envelope, and quota headers on every authenticated response.",
  responseJson: "JSON with charset=utf-8",
  responseFields: "Predictable item fields on every story",
  responseLang: "title and summary follow lang. arabic and english stay present.",
  responsePage: "Paginate with limit and offset. count is the unique-story total.",
  responseQuota: "X-API-Quota-Limit, X-API-Quota-Remaining, and X-API-Quota-Used.",
  errorsTitle: "Errors",
  errorsLede: "Failures use a flat error code and a message.",
  error401: "Missing or invalid X-API-Key.",
  error400: "A filter value was malformed or unknown.",
  error404: "No stored edition for that date yet.",
  error429: "Daily request limit exceeded for this plan.",
  error503: "The service is temporarily unavailable.",
  limitsTitle: "Usage limits",
  limitsLede:
    `Free includes ${PLAN_DEFINITIONS.FREE.dailyRequests} requests a day. Pro includes ${formatPlanCount(PLAN_DEFINITIONS.PRO.dailyRequests)}. Enterprise includes ${formatPlanCount(PLAN_DEFINITIONS.ENTERPRISE.dailyRequests)} by default. The daily limit renews automatically every day.`,
  limitsPage: "Default page size is 50. Maximum is 500.",
  limitsWindow:
    "Without from, to, or date, results use the default 72-hour live window. Indexed stories stay in the archive on every plan. Use from and to to query further back.",
  sdkTitle: "Use it the way your product needs",
  sdkJs: "JavaScript",
  sdkCurl: "cURL",
  sdkPy: "Python",
  sdkPhp: "PHP",
  consoleDocs: "Try requests in the console",
  faqTitle: "Technical questions",
  faqKeyQ: "How do I authenticate requests?",
  faqKeyA:
    "Send X-API-Key in the header. Create keys in the console.",
  faqScoreQ: "What does sort=score do?",
  faqScoreA:
    "It ranks stories by likely market impact. score is the default. date is newest first.",
  faqPageQ: "How do I paginate?",
  faqPageA:
    "Use limit and offset. Default limit is 50, maximum 500. count is the unique-story total for the query.",
  faqWindowQ: "Is the live window only 72 hours?",
  faqWindowA:
    "72 hours is the default query window. Indexed stories stay in the archive on every plan. Use from and to to query further back.",
} as const;

const ar = {
  crumb: "للمطوّرين",
  tocLabel: "التوثيق",
  tocStart: "البداية",
  tocAuth: "المصادقة",
  tocNews: "Market News",
  tocFilters: "الفلاتر",
  tocResponse: "الاستجابات",
  tocErrors: "الأخطاء",
  tocLimits: "حدود الاستخدام",
  heroTitle: "واجهة API لأخبار الأسواق",
  heroLede:
    "احصل على أخبار الأسواق بصيغة JSON، مع فلاتر واضحة وحقول عربية وإنجليزية ودرجات تأثير جاهزة للاستخدام.",
  ctaKey: "ابدأ بمفتاح API",
  ctaDocs: "شاهد كيف تعمل",
  baseLabel: "Base URL",
  startTitle: "ابدأ خلال 3 خطوات",
  start1Title: "أنشئ مفتاح API",
  start1Body: "أنشئ مفتاحك من لوحة المطوّر وأرسله مع كل طلب.",
  start2Title: "أرسل طلباً",
  start2Body: "أرسل GET /market-news مع المفتاح في ترويسة X-API-Key.",
  start3Title: "استلم البيانات",
  start3Body: "كل قصة تعيد عناوين ثنائية اللغة وفئة وسوقاً ودرجات تأثير.",
  curlLabel: "الطلب",
  jsonLabel: "الاستجابة",
  newsTitle: "Market News API",
  newsPath: "GET /market-news",
  newsLede: "استرجع أحدث الأخبار وفق الفلاتر التي يحتاجها منتجك.",
  paramsTitle: "Parameters",
  paramName: "Parameter",
  paramType: "النوع",
  paramDesc: "الوصف",
  paramQ: "بحث بالعربية أو الإنجليزية، بما في ذلك العبارات متعددة الكلمات.",
  paramSearchIn: "title أو summary أو both. الافتراضي both.",
  paramCountry: "رمز الدولة ISO. يمكن فصله بفاصلة. مثال: US,AE.",
  paramRegion: "منطقة السوق. middle_east أو america أو global.",
  paramCategory:
    "finance أو economics أو oil أو me_economy أو commodities أو markets أو رمز المعادن الثمينة في الكتالوج.",
  paramNationality: "رمز الجمهور. مطلوب في /market-news/nationality. مثال: IN.",
  paramLang: "لغة العنوان والملخص في الاستجابة. ar أو en. الافتراضي ar.",
  paramLanguage: "فلتر حسب لغة المصدر المخزّنة للقصة. ar أو en.",
  paramSource: "معرّف المصدر. يمكن فصله بفاصلة.",
  paramSort: "score يرتّب حسب أثر السوق. date يعيد الأحدث أولاً. الافتراضي score.",
  paramDate: "تاريخ واحد. YYYY-MM-DD. يتجاوز النافذة الحية الافتراضية.",
  paramFrom: "بداية فترة النشر شاملة. YYYY-MM-DD.",
  paramTo: "نهاية فترة النشر شاملة. YYYY-MM-DD.",
  paramLimit: "حجم الصفحة. الافتراضي 50، والحد الأقصى 500.",
  paramOffset: "عدد القصص التي تتخطاها. الافتراضي 0.",
  routesTitle: "نقاط النهاية العامة",
  routePath: "المسار",
  routeNews: "موجز حي قابل للفلترة. نافذة افتراضية 72 ساعة.",
  routeToday: "الإصدار اليومي المخزن لليوم.",
  routeDaily: "الإصدار اليومي المخزن لتاريخ محدد.",
  routeEditions: "قائمة تواريخ الإصدارات المنشورة.",
  routeNationality: "إحاطة الجالية. nationality مطلوب.",
  routeCategories: "كتالوج التصنيفات بعناوين عربية وإنجليزية.",
  routeCountries: "كتالوج الدول. نحو 70 رمز ISO.",
  routeNationalities: "رموز الجمهور لإحاطات الجاليات.",
  routeSources: "المصادر المتاحة لمفتاحك.",
  exampleTitle: "Example",
  modelTitle: "بيانات مصممة للاستخدام البرمجي",
  modelLede: "كل قصة تستخدم الحقول نفسها.",
  fieldTitle: "العنوان",
  fieldTitleBody: "title يتبع lang. arabic وenglish يبقيان في الكائن نفسه.",
  fieldCategory: "التصنيف",
  fieldCategoryBody: "فئة سوق ثابتة مثل markets أو finance أو oil.",
  fieldMarket: "السوق",
  fieldMarketBody: "country رمز ISO. region هي middle_east أو america أو global.",
  fieldImpact: "التأثير",
  fieldImpactBody: "scores.final وscores.marketImpact ترتّبان أثر السوق المتوقع.",
  fieldDate: "التاريخ",
  fieldDateBody: "publishedAt طابع زمني بصيغة ISO 8601.",
  filtersTitle: "فلترة الأخبار بالطريقة التي يحتاجها منتجك",
  filtersHint: "استخدم sort=score لترتيب الأخبار حسب درجة التأثير بدلاً من ترتيبها زمنياً فقط.",
  authTitle: "المصادقة",
  authLede: "أرسل مفتاح API في ترويسة X-API-Key مع كل طلب أخبار.",
  authHint: "أنشئ المفاتيح من لوحة المطوّر.",
  responseTitle: "الاستجابة",
  responseLede:
    "JSON وUTF-8 وحقول عربية وإنجليزية وغلاف ثابت وترويسات الحصة مع كل استجابة مصادَقة.",
  responseJson: "JSON بترميز utf-8",
  responseFields: "حقول ثابتة لكل قصة",
  responseLang: "title وsummary يتبعان lang. arabic وenglish يبقيان موجودين.",
  responsePage: "صفّح بـ limit وoffset. count هو إجمالي القصص الفريدة.",
  responseQuota: "X-API-Quota-Limit وX-API-Quota-Remaining وX-API-Quota-Used.",
  errorsTitle: "الأخطاء",
  errorsLede: "الأخطاء تعيد رمزاً مسطحاً ورسالة.",
  error401: "مفتاح X-API-Key ناقص أو غير صالح.",
  error400: "قيمة فلتر غير صالحة أو غير معروفة.",
  error404: "لا يوجد إصدار مخزن لهذا التاريخ بعد.",
  error429: "تجاوزت الحد اليومي لهذه الخطة.",
  error503: "الخدمة غير متاحة مؤقتاً.",
  limitsTitle: "حدود الاستخدام",
  limitsLede:
    `المجاني يشمل ${PLAN_DEFINITIONS.FREE.dailyRequests} طلبات يومياً. Pro يشمل ${formatPlanCount(PLAN_DEFINITIONS.PRO.dailyRequests)}. Enterprise يشمل ${formatPlanCount(PLAN_DEFINITIONS.ENTERPRISE.dailyRequests)} افتراضياً. يتجدد الحد اليومي تلقائياً كل يوم.`,
  limitsPage: "حجم الصفحة الافتراضي 50. الحد الأقصى 500.",
  limitsWindow:
    "من دون from أو to أو date تستخدم النتائج النافذة الحية الافتراضية لمدة 72 ساعة. القصص المفهرسة تبقى في الأرشيف على كل خطة. استخدم from وto للاستعلام أبعد.",
  sdkTitle: "استخدمها بالطريقة التي تناسب منتجك",
  sdkJs: "JavaScript",
  sdkCurl: "cURL",
  sdkPy: "Python",
  sdkPhp: "PHP",
  consoleDocs: "جرّب الطلبات من اللوحة",
  faqTitle: "أسئلة تقنية",
  faqKeyQ: "كيف أصادق الطلبات؟",
  faqKeyA:
    "أرسل X-API-Key في الترويسة. أنشئ المفاتيح في اللوحة.",
  faqScoreQ: "ماذا يفعل sort=score؟",
  faqScoreA:
    "يرتّب القصص حسب أثر السوق المتوقع. الافتراضي score. date يعيد الأحدث أولاً.",
  faqPageQ: "كيف أصفّح النتائج؟",
  faqPageA:
    "استخدم limit وoffset. الافتراضي 50 والحد الأقصى 500. count هو إجمالي القصص الفريدة للاستعلام.",
  faqWindowQ: "هل النافذة الحية 72 ساعة فقط؟",
  faqWindowA:
    "72 ساعة هي النافذة الافتراضية للاستعلام. القصص المفهرسة تبقى في الأرشيف على كل خطة. استخدم from وto للاستعلام أبعد.",
} as const;

export type DevelopersCopy = { [K in keyof typeof en]: string };

export function developersCopy(lang: MarketingLang): DevelopersCopy {
  return lang === "en" ? en : ar;
}

export const DEVELOPERS_BASE_URL = "https://www.brieflynewsstream.com/api/v1";

export const DEVELOPERS_HERO_HTTP = `GET /market-news
X-API-Key: YOUR_KEY`;

export const DEVELOPERS_CURL = `curl "https://www.brieflynewsstream.com/api/v1/market-news" \\
  -H "X-API-Key: YOUR_KEY"`;

export const DEVELOPERS_ITEM_JSON = `{
  "id": "...",
  "title": "أسواق الأسهم العالمية تتماسك مع ترقّب قرارات الفائدة",
  "summary": "الأسواق تبقى منتظمة بينما ينتظر المتعاملون الخطوة التالية في السياسة النقدية.",
  "arabic": {
    "title": "أسواق الأسهم العالمية تتماسك مع ترقّب قرارات الفائدة",
    "summary": "الأسواق تبقى منتظمة بينما ينتظر المتعاملون الخطوة التالية في السياسة النقدية."
  },
  "english": {
    "title": "Global equities hold as desks watch the next rate decision",
    "summary": "Stock markets stay orderly while traders wait for the next move in policy."
  },
  "category": "markets",
  "country": "GLOBAL",
  "publishedAt": "2026-08-21T12:00:00.000Z",
  "scores": {
    "final": 86,
    "marketImpact": 84
  }
}`;

export const DEVELOPERS_NEWS_EXAMPLE =
  "GET /market-news?region=global&category=markets&sort=score&limit=10";

export const DEVELOPERS_FILTER_EXAMPLE = `GET /market-news
  ?region=global
  &category=finance
  &lang=ar
  &sort=score
  &limit=20`;

export const DEVELOPERS_AUTH_HTTP = "X-API-Key: YOUR_KEY";

export const DEVELOPERS_ENVELOPE = `{
  "meta": {
    "version": "1.0.0",
    "lang": "ar"
  },
  "count": 10,
  "limit": 10,
  "offset": 0,
  "items": []
}`;

export const DEVELOPERS_ERROR_JSON = `{
  "error": "unauthorized",
  "message": "Missing or invalid API key."
}`;

export const DEVELOPERS_JS = `const response = await fetch(
  "https://www.brieflynewsstream.com/api/v1/market-news",
  {
    headers: {
      "X-API-Key": process.env.BRIEFLY_API_KEY
    }
  }
);
const data = await response.json();`;

export const DEVELOPERS_PYTHON = `import os
import urllib.request

req = urllib.request.Request(
    "https://www.brieflynewsstream.com/api/v1/market-news",
    headers={"X-API-Key": os.environ["BRIEFLY_API_KEY"]},
)
with urllib.request.urlopen(req) as response:
    print(response.read().decode())`;

export const DEVELOPERS_PHP = `$ch = curl_init("https://www.brieflynewsstream.com/api/v1/market-news");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "X-API-Key: " . getenv("BRIEFLY_API_KEY"),
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
echo curl_exec($ch);`;

export const DEVELOPERS_QUERY_FIELDS = [
  "q",
  "country",
  "region",
  "category",
  "nationality",
  "lang",
  "sort",
  "from",
  "to",
  "limit",
] as const;

export const DEVELOPERS_PARAMS = [
  { name: "q", type: "string", descKey: "paramQ" },
  { name: "searchIn", type: "string", descKey: "paramSearchIn" },
  { name: "country", type: "string", descKey: "paramCountry" },
  { name: "region", type: "string", descKey: "paramRegion" },
  { name: "category", type: "string", descKey: "paramCategory" },
  { name: "nationality", type: "string", descKey: "paramNationality" },
  { name: "lang", type: "string", descKey: "paramLang" },
  { name: "language", type: "string", descKey: "paramLanguage" },
  { name: "source", type: "string", descKey: "paramSource" },
  { name: "sort", type: "string", descKey: "paramSort" },
  { name: "date", type: "date", descKey: "paramDate" },
  { name: "from", type: "date", descKey: "paramFrom" },
  { name: "to", type: "date", descKey: "paramTo" },
  { name: "limit", type: "integer", descKey: "paramLimit" },
  { name: "offset", type: "integer", descKey: "paramOffset" },
] as const;

export const DEVELOPERS_ROUTES = [
  { path: "GET /market-news", descKey: "routeNews" },
  { path: "GET /market-news/today", descKey: "routeToday" },
  { path: "GET /market-news/daily", descKey: "routeDaily" },
  { path: "GET /market-news/editions", descKey: "routeEditions" },
  { path: "GET /market-news/nationality", descKey: "routeNationality" },
  { path: "GET /meta/categories", descKey: "routeCategories" },
  { path: "GET /meta/countries", descKey: "routeCountries" },
  { path: "GET /meta/nationalities", descKey: "routeNationalities" },
  { path: "GET /sources", descKey: "routeSources" },
] as const;

export const DEVELOPERS_ERRORS = [
  { status: "401", code: "unauthorized", descKey: "error401" },
  { status: "400", code: "invalid_query", descKey: "error400" },
  { status: "404", code: "edition_not_ready", descKey: "error404" },
  { status: "429", code: "quota_exceeded", descKey: "error429" },
  { status: "503", code: "server_error", descKey: "error503" },
] as const;
