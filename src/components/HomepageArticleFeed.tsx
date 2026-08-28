import Link from "next/link";
import { CaretLeft, CaretRight, Lightning } from "@phosphor-icons/react/ssr";
import type { Category, Region } from "@prisma/client";
import { articleLocalizedText } from "@/lib/article-translation";
import { countryRecord } from "@/lib/countries";
import { CATEGORY_META, REGION_META } from "@/lib/market";
import { landingCopy } from "@/lib/landing-translation";
import { newsFeedHref } from "@/lib/feed-view";
import { formatPublishedAge } from "@/lib/published-age";
import { BrandLoader } from "@/components/media/BrandLoader";
import { ImpactBadge } from "@/components/ImpactBadge";
import type { ArticleImpactScore } from "@/lib/impact-display";

type FeedArticle = {
  id: string;
  url: string;
  title: string;
  displayTitle: string | null;
  summary: string;
  displaySummary: string | null;
  titleEn: string | null;
  summaryEn: string | null;
  titleAr: string | null;
  summaryAr: string | null;
  language: string;
  category: Category;
  country: string;
  region: Region;
  publisher: string | null;
  publishedAt: Date;
  audienceCodes: string | null;
  source: { name: string };
  score: ArticleImpactScore | null;
};

function paginationItems(page: number, totalPages: number) {
  const visiblePages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return visiblePages.flatMap((item, index) => {
    const previous = visiblePages[index - 1];
    return previous && item - previous > 1
      ? [{ key: `gap-${previous}`, page: null }, { key: `page-${item}`, page: item }]
      : [{ key: `page-${item}`, page: item }];
  });
}

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
  view?: "top" | "all";
  hash?: string;
}) {
  return newsFeedHref(params);
}

function categoryLabel(category: Category, lang: string) {
  const meta = CATEGORY_META.find((item) => item.value === category);
  if (!meta) return category;
  return lang === "ar" ? meta.labelAr : meta.label;
}

function locationLabel(article: FeedArticle, lang: string) {
  const country = countryRecord(article.country);
  if (country) return lang === "ar" ? country.nameAr : country.country;
  const region = REGION_META.find((item) => item.value === article.region);
  if (!region) return article.country;
  return lang === "ar" ? region.labelAr : region.label;
}

export function HomepageArticleFeed({
  lang,
  q,
  category,
  country,
  nationality,
  sort,
  from,
  to,
  page,
  offset,
  matchedCount,
  totalPages,
  articles,
  topEditionView,
  editionItemCount,
  catalogCount,
  view,
}: {
  lang: string;
  q: string;
  category?: string;
  country?: string;
  nationality?: string;
  sort: string;
  from: string;
  to: string;
  page: number;
  offset: number;
  matchedCount: number;
  totalPages: number;
  articles: FeedArticle[];
  topEditionView: boolean;
  editionItemCount: number;
  catalogCount: number;
  view?: "top" | "all";
}) {
  const copy = landingCopy(lang);
  const filterState = {
    lang,
    q,
    category,
    country,
    nationality,
    sort,
    from,
    to,
    view: view === "top" ? "top" as const : undefined,
  };
  const articleHref = (id: string) => (lang === "en" ? `/news/${id}?lang=en` : `/news/${id}`);
  const topCount = topEditionView ? (editionItemCount || matchedCount) : 0;
  const showLoadFullBriefing = topEditionView && catalogCount > matchedCount;
  const hasFilters = Boolean(
    q || category || country || nationality || sort === "date" || from || to,
  );
  const fullCatalogView = !topEditionView && !hasFilters;
  const feedSubtitle = topEditionView
    ? copy.topEditionIndicator(topCount)
    : fullCatalogView
      ? [
          copy.fullCatalogSubtitle(matchedCount),
          totalPages > 1 ? copy.paginationStatus(page, totalPages) : null,
        ].filter(Boolean).join(" · ")
      : copy.topStoriesSubtitle;
  const ChevronIcon = copy.dir === "rtl" ? CaretLeft : CaretRight;

  return (
    <section id="homepage-feed" className="mkt-brief-feed" aria-live="polite">
      <div className="homepage-feed-searching mkt-brief-feed__searching" aria-hidden="true">
        <BrandLoader size="md" label={copy.searching} showLabel />
      </div>

      <div className="mkt-brief-feed-card">
        <header className="mkt-brief-feed-card__head">
          <div className="mkt-brief-feed-card__title">
            <span className="mkt-brief-feed-card__icon" aria-hidden="true">
              <Lightning size={18} weight="fill" />
            </span>
            <div>
              <h2>{copy.topStoriesTitle}</h2>
              <p>{feedSubtitle}</p>
            </div>
          </div>
        </header>

        {articles.length === 0 ? (
          <div id="homepage-first-article" className="mkt-brief-feed-empty">
            {copy.noMatches}
          </div>
        ) : (
          <ol className="mkt-brief-feed-list">
            {articles.map((article, index) => {
              const localized = articleLocalizedText(article, lang);
              const rank = String(offset + index + 1).padStart(2, "0");
              const meta = `${locationLabel(article, lang)} • ${categoryLabel(article.category, lang)}`;

              return (
                <li key={article.id}>
                  <article
                    id={index === 0 ? "homepage-first-article" : undefined}
                    className="mkt-brief-feed-row"
                  >
                    <span className="mkt-brief-feed-row__rank" aria-hidden="true">
                      {rank}
                    </span>
                    <div className="mkt-brief-feed-row__body">
                      <div className="mkt-brief-feed-row__title-row">
                        <ImpactBadge score={article.score} lang={lang} feedVariant />
                        <h3>
                          <Link href={articleHref(article.id)}>{localized.title}</Link>
                        </h3>
                      </div>
                      {localized.summary ? (
                        <p className="mkt-visually-hidden">{localized.summary}</p>
                      ) : null}
                      <div className="mkt-brief-feed-row__footer">
                        <p className="mkt-brief-feed-row__meta">{meta}</p>
                        <div className="mkt-brief-feed-row__aside">
                          <time dateTime={article.publishedAt.toISOString()}>
                            {formatPublishedAge(article.publishedAt, lang)}
                          </time>
                          <Link
                            href={articleHref(article.id)}
                            className="mkt-brief-feed-row__chevron"
                            aria-label={localized.title}
                          >
                            <ChevronIcon size={18} weight="bold" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        )}

        {showLoadFullBriefing ? (
          <div className="mkt-brief-feed-card__footer">
            <Link
              href={feedHref({ lang, hash: "#homepage-feed" })}
              className="mkt-brief-feed-card__load-more"
            >
              {copy.loadFullBriefing(catalogCount)}
            </Link>
          </div>
        ) : null}
      </div>

      {!topEditionView && totalPages > 1 && (
        <nav className="feed-pagination mkt-brief-feed-pagination" aria-label="Feed pages">
          {page > 1 ? (
            <Link href={feedHref({ ...filterState, page: page - 1 })} className="feed-pagination-link" rel="prev">
              {copy.paginationPrev}
            </Link>
          ) : (
            <span className="feed-pagination-link is-disabled">{copy.paginationPrev}</span>
          )}
          <div className="feed-pagination-center">
            <div className="feed-pagination-pages">
              {paginationItems(page, totalPages).map((item) =>
                item.page === null ? (
                  <span key={item.key} className="feed-pagination-gap" aria-hidden="true">
                    ...
                  </span>
                ) : item.page === page ? (
                  <span key={item.key} className="feed-pagination-page is-current" aria-current="page">
                    {item.page}
                  </span>
                ) : (
                  <Link
                    key={item.key}
                    href={feedHref({ ...filterState, page: item.page })}
                    className="feed-pagination-page"
                    aria-label={copy.paginationGoTo(item.page)}
                  >
                    {item.page}
                  </Link>
                ),
              )}
            </div>
            <p className="feed-pagination-status" aria-live="polite">
              {copy.paginationStatus(page, totalPages)}
            </p>
          </div>
          {page < totalPages ? (
            <Link href={feedHref({ ...filterState, page: page + 1 })} className="feed-pagination-link" rel="next">
              {copy.paginationNext}
            </Link>
          ) : (
            <span className="feed-pagination-link is-disabled">{copy.paginationNext}</span>
          )}
        </nav>
      )}
    </section>
  );
}
