import { HomepageArticleFeed } from "@/components/HomepageArticleFeed";
import { HomepageSearchBar } from "@/components/HomepageSearchBar";
import { CommunityBriefingFilter } from "@/components/CommunityBriefingFilter";
import { articleListOrderBy, listDedupedArticles, parseQuery } from "@/lib/api";
import { CATEGORY_META } from "@/lib/market";
import { limits } from "@/lib/limits";
import { HomepageDataOverview } from "@/components/HomepageDataOverview";
import { SupportedCountriesScreen } from "@/components/SupportedCountriesScreen";
import { JsonLd } from "@/components/seo/JsonLd";
import { landingCopy } from "@/lib/landing-translation";
import { expandSearchQuery } from "@/lib/search";
import {
  groupCountryCodesByRegion,
  supportedCountryCodes,
} from "@/lib/supported-countries";
import { getNewsFeedStats } from "@/lib/feed-stats";
import { COUNTRY_CATALOG } from "@/lib/countries";
import {
  SITE_NAME,
  siteTitle,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  newsMediaOrganizationJsonLd,
  pageMetadata,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  return pageMetadata({
    lang,
    title: isEn
      ? siteTitle("en", "Market briefing")
      : siteTitle("ar", "موجز الأسواق"),
    description: isEn
      ? "Bilingual market news briefing from Briefly NewsStream. Gulf, MENA, and global stories with impact scores — filter by country, category, and region."
      : "موجز أخبار أسواق ثنائي اللغة من Briefly NewsStream. أخبار الخليج والشرق الأوسط والعالم بدرجات أثر — صفِّ حسب الدولة والفئة والمنطقة.",
    path: "/news",
    pathEn: "/news?lang=en",
    keywords: [
      "market briefing",
      "Gulf market news",
      "GCC market news",
      "Middle East market news",
      "Arabic market news",
      "MENA financial news",
      "regional news briefing",
    ],
  });
}

const arabicCategoryLabels: Record<string, string> = {
  gold: "المعادن الثمينة",
  finance: "الأسواق المالية",
  economics: "الاقتصاد والبنوك المركزية",
  oil: "النفط والغاز",
  me_economy: "اقتصاد الشرق الأوسط",
  commodities: "السلع",
  banking: "البنوك والمصارف",
  real_estate: "العقارات",
  tech: "التكنولوجيا",
  energy: "الطاقة والمرافق",
  trade: "التجارة العالمية",
  fx: "العملات والصرف",
  crypto: "الأصول الرقمية والمشفرة",
  shipping: "الشحن والخدمات اللوجستية",
  insurance: "التأمين",
  policy: "السياسات والتنظيم",
  markets: "أخبار السوق المؤثرة",
};

function feedHref(params: {
  lang?: string;
  q?: string;
  category?: string;
  country?: string;
  nationality?: string;
  sort?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params.lang && params.lang !== "ar") query.set("lang", params.lang);
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.country) query.set("country", params.country);
  if (params.nationality) query.set("nationality", params.nationality);
  if (params.sort && params.sort !== "date") query.set("sort", params.sort);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const value = query.toString();
  return value ? `/news?${value}` : "/news";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string;
    q?: string;
    category?: string;
    country?: string;
    nationality?: string;
    sort?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "ar";
  const copy = landingCopy(lang);
  const q = params.q?.trim().replace(/\s+/g, " ").slice(0, 200) || "";
  const country = params.country?.toUpperCase();
  const sort = params.sort === "score" ? "score" : "date";
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : "";
  const to = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : "";
  const pageSize = Math.max(1, limits.dashboard);
  const requestedPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const liveFreshnessHours = Math.max(1, limits.newsMaxAgeHours);
  const sourceHealthHours = Math.max(1, limits.sourceHealthMaxAgeHours);
  const requestedOffset = (requestedPage - 1) * pageSize;
  const feedParams = new URLSearchParams();
  if (q) feedParams.set("q", q);
  if (params.category) feedParams.set("category", params.category);
  if (country) feedParams.set("country", country);
  if (params.nationality) feedParams.set("nationality", params.nationality);
  feedParams.set("sort", sort);
  if (from) feedParams.set("from", from);
  if (to) feedParams.set("to", to);
  feedParams.set("limit", String(pageSize));
  feedParams.set("offset", String(requestedOffset));
  const searchVariants = await expandSearchQuery(q);
  const stats = await getNewsFeedStats();
  let freshnessHours = liveFreshnessHours;
  let matchedCount = 0;
  let fetchedArticles: Awaited<ReturnType<typeof listDedupedArticles>>["items"] = [];
  try {
    const feedQuery = parseQuery(feedParams, { searchVariants });
    freshnessHours = feedQuery.filters.freshnessHours ?? liveFreshnessHours;
    const listed = await listDedupedArticles(
      feedQuery.where,
      articleListOrderBy(feedQuery.sort),
      feedQuery.limit,
      feedQuery.offset,
      { lang },
    );
    matchedCount = listed.count;
    fetchedArticles = listed.items;
  } catch (error) {
    console.error("news feed query unavailable", error);
  }
  const liveCountrySet = new Set(stats.liveCountries);
  const countries = supportedCountryCodes(stats.sourceCountries);
  const countryGroups = groupCountryCodesByRegion(countries, lang);
  const totalPages = Math.max(1, Math.ceil(matchedCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const articles = fetchedArticles;
  const articleCount = stats.articleCount;
  const editionItemCount = stats.editionItemCount;
  const healthySources = stats.healthySources;
  const offset = (page - 1) * pageSize;
  const filterState = {
    lang,
    q,
    category: params.category,
    country,
    nationality: params.nationality,
    sort,
    from,
    to,
  };
  const operationalMetrics = [
    {
      id: "fresh",
      label: copy.freshArticles,
      value: articleCount,
      detail: copy.publishedWithin(liveFreshnessHours),
      hint: copy.freshArticlesHint,
    },
    {
      id: "feeds",
      label: copy.healthySources,
      value: `${healthySources}/${stats.sourceCount}`,
      detail: copy.successfulFetchWithin(healthySources, stats.sourceCount, sourceHealthHours),
      hint: copy.healthySourcesHint,
    },
    {
      id: "brief",
      label: copy.todaysEdition,
      value: editionItemCount,
      detail: copy.todaysBriefDetail(limits.dailyEdition),
      hint: copy.todaysEditionHint(limits.dailyEdition),
    },
    {
      id: "countries",
      label: copy.countriesCovered,
      value: `${liveCountrySet.size}/${countries.length}`,
      detail: copy.supportedCatalog(liveCountrySet.size, countries.length, liveFreshnessHours),
      hint: copy.countriesCoveredHint,
    },
  ];
  const structuredData = [
    newsMediaOrganizationJsonLd(),
    websiteJsonLd(),
    webPageJsonLd({
      lang,
      name: lang === "en" ? "Market briefing" : "موجز أخبار الأسواق",
      description: `${copy.heroLede} ${copy.heroBody}`,
      path: "/news",
      speakableCssSelectors: [".mkt-news-hero h1", ".mkt-news-hero p", "[data-aeo-answer]"],
    }),
    collectionPageJsonLd({
      name: lang === "en" ? "Market briefing" : "موجز أخبار الأسواق",
      description: `${copy.heroLede} ${copy.heroBody}`,
      path: "/news",
      lang,
    }),
    breadcrumbJsonLd([
      { name: lang === "en" ? "Home" : "الرئيسية", path: "/" },
      { name: lang === "en" ? "Briefing" : "الموجز", path: "/news" },
    ]),
  ];

  return (
    <div className="mkt-page mkt-news-page" lang={copy.lang} dir={copy.dir}>
      <JsonLd data={structuredData} />
      <div className="mkt-section">
        <div className="mkt-section-head mkt-news-hero">
          <h1>{copy.heroTitle}</h1>
          <p data-aeo-answer>{copy.heroLede}</p>
          <p>{copy.heroBody}</p>
        </div>

      <HomepageDataOverview
          lang={lang}
          countriesCovered={COUNTRY_CATALOG.length}
        />
        <section
          className="homepage-metrics"
          aria-label={lang === "ar" ? "مؤشرات التغطية" : "Coverage metrics"}
          dir={copy.dir}
          lang={copy.lang}
        >
          <p className="homepage-metrics-note">{copy.metricsNote}</p>
          <dl>
            {operationalMetrics.map((metric) => (
              <div key={metric.id} className="homepage-metric">
                <dt>
                  <span>{metric.label}</span>
                  <button
                    type="button"
                    className="homepage-metric-hint"
                    aria-describedby={`metric-tip-${metric.id}`}
                    aria-label={copy.metricHintLabel}
                  >
                    i
                  </button>
                </dt>
                <dd className="homepage-hero-metric-value">{metric.value}</dd>
                <dd className="homepage-hero-metric-detail">{metric.detail}</dd>
                <p id={`metric-tip-${metric.id}`} className="homepage-metric-tooltip" role="tooltip">
                  {metric.hint}
                </p>
              </div>
            ))}
          </dl>
        </section>

        <SupportedCountriesScreen
          title={copy.supportedCountries}
          liveLabel={copy.liveInFeed}
          catalogLabel={copy.supportedCountries}
          searchPlaceholder={copy.countrySearchPlaceholder}
          searchLabel={copy.countrySearchLabel}
          emptyLabel={copy.countrySearchEmpty}
          dir={copy.dir}
          lang={lang}
          groups={countryGroups.map((group) => ({
            key: group.key,
            label: group.label,
            items: group.items.map((item) => {
              const live = liveCountrySet.has(item.code);
              const active = country === item.code;
              return {
                code: item.code,
                name: item.name,
                label: item.label,
                href: feedHref({ ...filterState, country: active ? undefined : item.code, page: 1 }),
                live,
                active,
              };
            }),
          }))}
        />

        <section className="mkt-news-filters" aria-labelledby="filters-title">
          <h2 id="filters-title">{copy.filtersTitle}</h2>
          <HomepageSearchBar
            initialQuery={q}
            searchPlaceholder={copy.searchPlaceholder}
            searchButton={copy.searchButton}
            searchingLabel={copy.searching}
            searchClearLabel={copy.searchClear}
            params={{
              lang,
              category: params.category,
              country,
              nationality: params.nationality,
              sort,
              from,
              to,
            }}
          />
          <p className="homepage-search-help">{copy.searchHelp}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={feedHref({
                lang,
                q,
                nationality: params.nationality,
                sort,
                from,
                to,
              })}
              className={`filter-chip ${!params.category ? "filter-chip-active" : ""}`}
              scroll={false}
            >
              {copy.all}
            </Link>
            {CATEGORY_META.map((item) => (
              <Link
                key={item.code}
                href={feedHref({
                  lang,
                  q,
                  category: item.code,
                  country,
                  nationality: params.nationality,
                  sort,
                  from,
                  to,
                })}
                className={`filter-chip ${params.category === item.code ? "filter-chip-active" : ""}`}
                scroll={false}
              >
                {lang === "ar" ? arabicCategoryLabels[item.code] || item.label : item.label}
              </Link>
            ))}
          </div>
          <form className="homepage-filter-bar" method="get">
            {lang !== "ar" && <input type="hidden" name="lang" value={lang} />}
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.nationality && <input type="hidden" name="nationality" value={params.nationality} />}
            {q && <input type="hidden" name="q" value={q} />}
            <label className="homepage-filter-field" htmlFor="home-country">
              <span>{lang === "ar" ? "الدولة" : "Country"}</span>
              <select id="home-country" name="country" defaultValue={country || ""}>
                <option value="">{lang === "ar" ? "كل الدول" : "All countries"}</option>
                {countryGroups.map((group) => (
                  <optgroup key={group.key} label={group.label}>
                    {group.items.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="homepage-filter-field" htmlFor="home-sort">
              <span>{copy.sort}</span>
              <select id="home-sort" name="sort" defaultValue={sort}>
                <option value="date">{copy.sortDate}</option>
                <option value="score">{copy.sortScore}</option>
              </select>
            </label>
            <label className="homepage-filter-field" htmlFor="home-from">
              <span>{copy.fromDate}</span>
              <input id="home-from" name="from" type="date" defaultValue={from} />
            </label>
            <label className="homepage-filter-field" htmlFor="home-to">
              <span>{copy.toDate}</span>
              <input id="home-to" name="to" type="date" defaultValue={to} />
            </label>
            <button type="submit" className="homepage-filter-button">
              {copy.apply}
            </button>
          </form>
          <CommunityBriefingFilter
            key={params.nationality || "all"}
            initialNationality={params.nationality || ""}
            category={params.category}
            country={country}
            lang={lang}
            q={q}
            sort={sort}
            from={from}
            to={to}
            freshnessHours={freshnessHours}
          />
        </section>

        <HomepageArticleFeed
          lang={lang}
          q={q}
          category={params.category}
          country={country}
          nationality={params.nationality}
          sort={sort}
          from={from}
          to={to}
          page={page}
          offset={offset}
          matchedCount={matchedCount}
          totalPages={totalPages}
          articles={articles}
        />
      </div>
    </div>
  );
}
