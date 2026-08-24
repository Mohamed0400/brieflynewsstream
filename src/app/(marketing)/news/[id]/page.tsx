import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { serializeArticle } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  breadcrumbJsonLd,
  newsArticleJsonLd,
  organizationJsonLd,
  pageMetadata,
  siteTitle,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

async function loadArticle(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: { source: true, score: true },
  });
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const article = await loadArticle(id);
  if (!article) return { robots: { index: false, follow: false } };
  const serialized = serializeArticle(article, undefined, lang);
  return pageMetadata({
    lang,
    title: siteTitle(lang, serialized.title.slice(0, 55)),
    description: serialized.summary.slice(0, 160),
    path: `/news/${id}`,
    pathEn: `/news/${id}?lang=en`,
    ogType: "article",
    keywords: [
      "market news",
      serialized.country,
      serialized.category,
      "market intelligence",
    ],
  });
}

export default async function NewsStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  const article = await loadArticle(id);
  if (!article) notFound();

  const story = serializeArticle(article, undefined, lang);
  const feedHref = isEn ? "/news?lang=en" : "/news";
  const sourceHref = story.url;

  return (
    <div className="mkt-page" lang={isEn ? "en" : "ar"} dir={isEn ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          newsArticleJsonLd({
            lang,
            id: story.id,
            title: story.title,
            summary: story.summary,
            url: story.url,
            imageUrl: story.imageUrl,
            publishedAt: story.publishedAt,
            sourceName: story.source,
            country: story.country,
          }),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: "/" },
            { name: isEn ? "Briefing" : "الموجز", path: "/news" },
            { name: story.title.slice(0, 48), path: `/news/${story.id}` },
          ]),
        ]}
      />
      <article className="mkt-section mkt-story">
        <p className="mkt-story-meta">
          <span>{story.source}</span>
          <span>{story.country}</span>
          <span>{story.category}</span>
          <time dateTime={story.publishedAt}>
            {new Date(story.publishedAt).toLocaleString(isEn ? "en" : "ar", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
          {story.scores?.final != null ? (
            <span className="mkt-impact-pill">
              {isEn ? "Impact" : "أثر"} {story.scores.final}
            </span>
          ) : null}
        </p>
        <h1>{story.title}</h1>
        <p className="mkt-story-summary" data-aeo-answer>
          {story.summary}
        </p>
        {story.imageUrl ? (
          <div className="mkt-story-image">
            {/* Publisher image hosts vary; next/image remotePatterns cannot cover all. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.imageUrl} alt="" width={1200} height={675} />
          </div>
        ) : null}
        <div className="mkt-bilingual-pair mkt-story-langs">
          {story.arabic.title ? (
            <aside lang="ar" dir="rtl">
              <h2>{isEn ? "Arabic" : "العربية"}</h2>
              <p>
                <strong>{story.arabic.title}</strong>
              </p>
              {story.arabic.summary ? <p>{story.arabic.summary}</p> : null}
            </aside>
          ) : null}
          {story.english.title ? (
            <aside lang="en" dir="ltr">
              <h2>{isEn ? "English" : "الإنجليزية"}</h2>
              <p>
                <strong>{story.english.title}</strong>
              </p>
              {story.english.summary ? <p>{story.english.summary}</p> : null}
            </aside>
          ) : null}
        </div>
        <div className="mkt-cta-row">
          <a
            href={sourceHref}
            className="mkt-btn mkt-btn-primary"
            rel="noopener noreferrer"
            target="_blank"
          >
            {isEn ? "Read original source" : "اقرأ المصدر الأصلي"}
          </a>
          <Link href={feedHref} className="mkt-btn mkt-btn-ghost">
            {isEn ? "Back to briefing" : "العودة إلى الموجز"}
          </Link>
        </div>
      </article>
    </div>
  );
}
