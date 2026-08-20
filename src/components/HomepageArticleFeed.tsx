import Link from "next/link";
import type { Category, Region } from "@prisma/client";
import { articleLocalizedText } from "@/lib/article-translation";
import {
  audienceCodesFromValue,
  optionForCode,
} from "@/lib/nationalities";
import { categoryToCode, regionToCode } from "@/lib/market";
import { landingCopy } from "@/lib/landing-translation";

const timeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kuwait",
});

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
  score: { finalScore: number } | null;
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
}) {
  const copy = landingCopy(lang);
  const rangeStart = matchedCount ? offset + 1 : 0;
  const rangeEnd = Math.min(offset + articles.length, matchedCount);
  const filterState = { lang, q, category, country, nationality, sort, from, to };

  return (
    <section id="homepage-feed" className="homepage-feed grid gap-4 pb-16" aria-live="polite">
      <div className="homepage-feed-searching" role="status" aria-live="polite" aria-hidden="true">
        <span className="homepage-search-spinner" aria-hidden="true" />
        <span>{copy.searching}</span>
      </div>
      {matchedCount > 0 && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-900/10 pb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-slate-600">{copy.liveFeed}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {copy.showing} {rangeStart}-{rangeEnd} / {matchedCount.toLocaleString("en")} {copy.matchingArticles}
            </p>
          </div>
          {totalPages > 1 && (
            <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
              {copy.page} {page} / {totalPages}
            </p>
          )}
        </div>
      )}
      {articles.length === 0 ? (
        <div
          id="homepage-first-article"
          className="border border-dashed border-slate-400 bg-white/50 p-8 text-center text-slate-600"
        >
          {copy.noMatches}
        </div>
      ) : articles.map((article, index) => {
        const localized = articleLocalizedText(article, lang);
        return (
          <article
            key={article.id}
            id={index === 0 ? "homepage-first-article" : undefined}
            className="group grid gap-4 border-t border-slate-900/15 bg-white/45 p-5 transition-colors hover:bg-white sm:grid-cols-[56px_1fr_auto]"
          >
            <span className="font-mono text-2xl text-slate-400">{String(offset + index + 1).padStart(2, "0")}</span>
            <div>
              {article.audienceCodes && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {audienceCodesFromValue(article.audienceCodes).map((code) => {
                    const option = optionForCode(code);
                    return option ? (
                      <span key={code} className="rounded-full bg-emerald-900/10 px-2 py-1 text-xs text-emerald-900">
                        {option.flag} {option.nationality}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <span className="text-amber-700">{categoryToCode(article.category)}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">{article.country} | {regionToCode(article.region)}</span>
              </div>
              <h2 className="max-w-5xl text-2xl font-semibold leading-8 tracking-[-0.02em]">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="rounded-sm outline-none transition-colors hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-amber-600">
                  {localized.title}
                </a>
              </h2>
              {localized.summary && (
                <p className="mt-3 max-w-4xl text-base leading-6 text-slate-600">
                  {localized.summary}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-500">
                {article.publisher || article.source.name}
                {article.publisher ? ` | ${copy.discoveredBy} ${article.source.name}` : ""}
                {" | "}{timeFormat.format(article.publishedAt)}
              </p>
            </div>
            <div className="self-start border border-slate-900/15 bg-[#f4f1e8] px-3 py-2 text-right">
              <p className="text-[10px] font-semibold tracking-wider text-slate-500">{copy.impact}</p>
              <p className="font-mono text-xl font-semibold">{Math.round(article.score?.finalScore ?? 0)}</p>
            </div>
          </article>
        );
      })}
      {totalPages > 1 && (
        <nav className="feed-pagination" aria-label="Feed pages">
          {page > 1 ? (
            <Link href={feedHref({ ...filterState, page: page - 1 })} className="feed-pagination-link" rel="prev">
              Previous
            </Link>
          ) : (
            <span className="feed-pagination-link is-disabled">Previous</span>
          )}
          <div className="feed-pagination-center">
            <div className="feed-pagination-pages">
              {paginationItems(page, totalPages).map((item) => (
                item.page === null ? (
                  <span key={item.key} className="feed-pagination-gap" aria-hidden="true">...</span>
                ) : item.page === page ? (
                  <span key={item.key} className="feed-pagination-page is-current" aria-current="page">
                    {item.page}
                  </span>
                ) : (
                  <Link
                    key={item.key}
                    href={feedHref({ ...filterState, page: item.page })}
                    className="feed-pagination-page"
                    aria-label={`Go to page ${item.page}`}
                  >
                    {item.page}
                  </Link>
                )
              ))}
            </div>
            <p className="feed-pagination-status" aria-live="polite">
              Page {page} of {totalPages}
            </p>
          </div>
          {page < totalPages ? (
            <Link href={feedHref({ ...filterState, page: page + 1 })} className="feed-pagination-link" rel="next">
              Next
            </Link>
          ) : (
            <span className="feed-pagination-link is-disabled">Next</span>
          )}
        </nav>
      )}
    </section>
  );
}
