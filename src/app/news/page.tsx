import { prisma } from "@/lib/prisma";
import { HomepageArticleFeed } from "@/components/HomepageArticleFeed";
import { HomepageSearchBar } from "@/components/HomepageSearchBar";
import { CommunityBriefingFilter } from "@/components/CommunityBriefingFilter";
import { articleListOrderBy, countDedupedArticles, fetchDedupedArticles } from "@/lib/api";
import { isArabicText, isEnglishText, localizeFetchedArticles, translatePendingArticles } from "@/lib/article-translation";
import { CATEGORY_META, categoryFromCode } from "@/lib/market";
import { limits } from "@/lib/limits";
import { expandNationalityInputs } from "@/lib/nationalities";
import { HomepageHero } from "@/components/HomepageHero";
import { HomepageDataOverview } from "@/components/HomepageDataOverview";
import { SupportedCountriesScreen } from "@/components/SupportedCountriesScreen";
import { JsonLd } from "@/components/seo/JsonLd";
import { landingCopy } from "@/lib/landing-translation";
import { expandSearchQuery, searchWords } from "@/lib/search";
import { startEmbeddedScheduler } from "@/lib/scheduler";
import { ensureTodaysEdition } from "@/lib/pipeline";
import {
  localizedCountryLabel,
  supportedCountryCodes,
} from "@/lib/supported-countries";
import { COUNTRY_CATALOG } from "@/lib/countries";
import {
  SITE_NAME,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  pageMetadata,
  websiteJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import type { Prisma } from "@prisma/client";

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
      ? `Live Market News Feed | Kuwait, Middle East & Global | ${SITE_NAME}`
      : `بث أخبار الأسواق المباشر | الكويت والشرق الأوسط والعالم | ${SITE_NAME}`,
    description: isEn
      ? "Live bilingual market news feed from Briefly NewsStream. Filter by country, category, and impact—Kuwait, Middle East, Arabic-speaking markets, and global coverage."
      : "بث أخبار الأسواق ثنائي اللغة من Briefly NewsStream. صفِّ حسب الدولة والفئة والأثر—للكويت والشرق الأوسط والدول الناطقة بالعربية والعالم.",
    path: "/news",
    pathEn: "/news?lang=en",
    keywords: [
      "live news feed",
      "Kuwait market news",
      "Middle East market news",
      "Gulf market news",
      "Arabic market news",
      "gold news",
      "financial news",
    ],
  });
}

const arabicCategoryLabels: Record<string, string> = {
  gold: "الذهب والمعادن الثمينة",
  finance: "الأسواق المالية",
  economics: "الاقتصاد والبنوك المركزية",
  oil: "النفط والطاقة",
  me_economy: "اقتصاد الشرق الأوسط",
  commodities: "السلع",
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
  if (params.sort && params.sort !== "score") query.set("sort", params.sort);
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
  startEmbeddedScheduler("next");
  const lang = params.lang === "en" ? "en" : "ar";
  const copy = landingCopy(lang);
  const q = params.q?.trim().replace(/\s+/g, " ").slice(0, 200) || "";
  const category = params.category ? categoryFromCode(params.category) : undefined;
  const country = params.country?.toUpperCase();
  const nationalityCodes = expandNationalityInputs(params.nationality ? [params.nationality] : []);
  const searchVariants = await expandSearchQuery(q);
  const sort = params.sort === "date" ? "date" : "score";
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : "";
  const to = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : "";
  const pageSize = Math.max(1, limits.dashboard);
  const requestedPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const requestedAt = new Date();
  const liveFreshnessHours = Math.max(1, limits.newsMaxAgeHours);
  const freshnessHours = nationalityCodes.length
    ? Math.min(liveFreshnessHours, Math.max(1, limits.nationalityMaxAgeHours))
    : liveFreshnessHours;
  const freshnessCutoff = new Date(requestedAt.getTime() - freshnessHours * 60 * 60 * 1000);
  const liveFreshnessFilter = {
    publishedAt: {
      gte: new Date(requestedAt.getTime() - liveFreshnessHours * 60 * 60 * 1000),
    },
  };
  const sourceHealthHours = Math.max(1, limits.sourceHealthMaxAgeHours);
  const sourceHealthCutoff = new Date(requestedAt.getTime() - sourceHealthHours * 60 * 60 * 1000);
  const freshnessFilter = {
    publishedAt: {
      gte: freshnessCutoff,
    },
  };
  const where: Prisma.ArticleWhereInput = {
    ...freshnessFilter,
    ...(category ? { category } : {}),
    ...(country ? { country } : {}),
  };
  const andFilters: Prisma.ArticleWhereInput[] = [];
  if (nationalityCodes.length) {
    andFilters.push(
      { OR: nationalityCodes.map((code) => ({ audienceCodes: { contains: `|${code}|` } })) },
    );
  }
  if (q) {
    andFilters.push({
      OR: searchVariants.map((variant): Prisma.ArticleWhereInput => ({
        AND: searchWords(variant).map((word) => ({
          OR: [
            { title: { contains: word } },
            { displayTitle: { contains: word } },
            { titleEn: { contains: word } },
            { titleAr: { contains: word } },
            { summary: { contains: word } },
            { displaySummary: { contains: word } },
            { summaryEn: { contains: word } },
            { summaryAr: { contains: word } },
          ],
        })),
      })),
    });
  }
  if (from || to) {
    where.publishedAt = {};
    if (from) where.publishedAt.gte = new Date(`${from}T00:00:00+03:00`);
    if (to) {
      const next = new Date(`${to}T00:00:00+03:00`);
      next.setUTCDate(next.getUTCDate() + 1);
      where.publishedAt.lt = next;
    }
  }
  if (andFilters.length) where.AND = andFilters;
  const orderBy = articleListOrderBy(sort);
  const [matchedCount, articleCount, storedCount, sources, editionItemCount, liveCountries, storedCountries] = await Promise.all([
    countDedupedArticles(where, orderBy),
    prisma.article.count({ where: liveFreshnessFilter }),
    prisma.article.count(),
    prisma.source.findMany({ where: { enabled: true }, orderBy: { qualityWeight: "desc" } }),
    ensureTodaysEdition(),
    prisma.article.findMany({
      where: liveFreshnessFilter,
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
    prisma.article.findMany({
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
  ]);
  const liveCountrySet = new Set(liveCountries.map((row) => row.country));
  const countries = supportedCountryCodes([
    ...sources.map((source) => source.country),
    ...storedCountries.map((row) => row.country),
  ]);
  const totalPages = Math.max(1, Math.ceil(matchedCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const fetchedArticles = await fetchDedupedArticles(where, orderBy, pageSize, offset);
  const missing = fetchedArticles.filter((article) => (
    lang === "en" ? !isEnglishText(article.titleEn) : !isArabicText(article.titleAr)
  ));
  const localized = await localizeFetchedArticles(missing.slice(0, 24), lang);
  const localizedById = new Map(localized.map((article) => [article.id, article]));
  const articles = fetchedArticles.map((article) => localizedById.get(article.id) ?? article);
  after(() => {
    void translatePendingArticles();
  });
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
  const healthySources = sources.filter((source) => (
    source.lastFetchedAt &&
    source.lastFetchedAt >= sourceHealthCutoff &&
    !source.lastError
  )).length;
  const operationalMetrics = [
    {
      id: "fresh",
      label: copy.freshArticles,
      value: articleCount,
      detail: copy.publishedWithin(liveFreshnessHours),
      hint: copy.freshArticlesHint,
    },
    {
      id: "stored",
      label: copy.storedArticles,
      value: storedCount,
      detail: copy.allDatabaseRecords,
      hint: copy.storedArticlesHint,
    },
    {
      id: "feeds",
      label: copy.healthySources,
      value: `${healthySources}/${sources.length}`,
      detail: copy.successfulFetchWithin(healthySources, sources.length, sourceHealthHours),
      hint: copy.healthySourcesHint,
    },
    {
      id: "brief",
      label: copy.todaysEdition,
      value: editionItemCount,
      detail: copy.todaysBriefDetail(limits.dailyEdition),
      hint: copy.todaysEditionHint,
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
    websiteJsonLd(),
    collectionPageJsonLd({
      name: lang === "en" ? "Live market news feed" : "بث أخبار الأسواق المباشر",
      description: `${copy.heroLede} ${copy.heroBody}`,
      path: "/news",
      lang,
    }),
    breadcrumbJsonLd([
      { name: lang === "en" ? "Home" : "الرئيسية", path: "/" },
      { name: lang === "en" ? "Live feed" : "البث المباشر", path: "/news" },
    ]),
  ];

  return (
    <div className="homepage-shell min-h-[100dvh] bg-[#f3eee6] text-slate-950" lang={copy.lang}>
      <JsonLd data={structuredData} />
      <header className="border-b border-slate-900/15 bg-[#0d1b17] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-amber-400/40 bg-amber-300 text-lg font-bold text-slate-950">G</span>
            <Link href={lang === "en" ? "/?lang=en" : "/"} className="text-lg font-semibold tracking-tight text-white">
              Briefly NewsStream
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="homepage-language-switcher" role="group" aria-label="Language switcher">
              <Link
                href={feedHref({ ...filterState, lang: "ar", page: 1 })}
                className={`homepage-language-link ${lang === "ar" ? "is-active" : ""}`}
                hrefLang="ar"
                lang="ar"
                scroll={false}
              >
                العربية
              </Link>
              <Link
                href={feedHref({ ...filterState, lang: "en", page: 1 })}
                className={`homepage-language-link ${lang === "en" ? "is-active" : ""}`}
                hrefLang="en"
                lang="en"
                scroll={false}
              >
                English
              </Link>
            </div>
            <Link
              href={lang === "en" ? "/?lang=en" : "/"}
              className="hidden min-h-11 items-center rounded-lg border border-white/20 px-3 text-sm text-white/90 sm:inline-flex"
            >
              {lang === "ar" ? "المنصة" : "Product"}
            </Link>
            <Link
              href="/console"
              className="inline-flex min-h-11 items-center rounded-lg bg-emerald-200 px-4 text-sm font-semibold text-emerald-950 transition-transform active:scale-[0.98]"
            >
              {copy.console}
            </Link>
          </div>
        </div>
      </header>

      <HomepageHero lang={lang} />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8" dir={copy.dir}>
        <HomepageDataOverview
          lang={lang}
          articlesIndexed={storedCount}
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
          dir={copy.dir}
          lang={lang}
          countries={countries.map((code) => {
            const live = liveCountrySet.has(code);
            const active = country === code;
            return {
              code,
              label: localizedCountryLabel(code, lang),
              href: feedHref({ ...filterState, country: active ? undefined : code, page: 1 }),
              live,
              active,
            };
          })}
        />

        <section className="py-8" aria-labelledby="filters-title">
          <h2 id="filters-title" className="mb-4 text-sm font-semibold tracking-wider text-slate-600">{copy.filtersTitle}</h2>
          <HomepageSearchBar
            initialQuery={q}
            searchPlaceholder={copy.searchPlaceholder}
            searchButton={copy.searchButton}
            searchingLabel={copy.searching}
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
                {countries.map((item) => (
                  <option key={item} value={item}>
                    {localizedCountryLabel(item, lang)}
                  </option>
                ))}
              </select>
            </label>
            <label className="homepage-filter-field" htmlFor="home-sort">
              <span>{copy.sort}</span>
              <select id="home-sort" name="sort" defaultValue={sort}>
                <option value="score">{copy.sortScore}</option>
                <option value="date">{copy.sortDate}</option>
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
      </main>
    </div>
  );
}
