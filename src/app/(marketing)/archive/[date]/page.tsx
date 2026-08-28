// Archive route disabled — cold storage / R2 integration not working yet.
import { notFound } from "next/navigation";

export default function ArchiveDayPageDisabled() {
  notFound();
}

/*
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { queryArchiveDay } from "@/lib/archive/reader";
import { marketingCopy, type MarketingLang } from "@/lib/marketing-copy";
import { withMarketingLang } from "@/lib/marketing-nav";
import { pageMetadata, siteTitle } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  return pageMetadata({
    lang,
    title: isEn ? siteTitle("en", `Archive ${date}`) : siteTitle("ar", `أرشيف ${date}`),
    description: isEn
      ? `Archived market stories for ${date}.`
      : `قصص الأسواق المؤرشفة لتاريخ ${date}.`,
    path: `/archive/${date}`,
    pathEn: `/archive/${date}?lang=en`,
  });
}

export default async function ArchiveDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ lang?: string; q?: string }>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const sp = await searchParams;
  const lang = (sp.lang === "en" ? "en" : "ar") as MarketingLang;
  const copy = marketingCopy(lang);
  const withLang = (path: string) => withMarketingLang(path, lang);
  const result = await queryArchiveDay({
    date,
    lang,
    q: sp.q,
    limit: 100,
    offset: 0,
  });

  return (
    <div className="mkt-page">
      <section className="mkt-section">
        <div className="mkt-section-head">
          <p className="mkt-kicker">{copy.archiveKicker}</p>
          <h1>{copy.archiveDayTitle(date)}</h1>
          <p>{copy.archiveDayLede(result.total)}</p>
        </div>

        {!result.configured ? (
          <p className="mkt-muted">{copy.archiveNotConfigured}</p>
        ) : result.items.length === 0 ? (
          <p className="mkt-muted">{copy.archiveEmptyDay}</p>
        ) : (
          <ol className="mkt-archive-list">
            {result.items.map((item) => (
              <li key={item.id}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  <h2>{item.title}</h2>
                </a>
                <p>{item.summary}</p>
                <p className="mkt-muted">
                  {[item.publisher || item.sourceName, item.country, item.category]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ol>
        )}

        <div className="mkt-cta-row" style={{ marginTop: "1.5rem" }}>
          <Link href={withLang("/archive")} className="mkt-btn mkt-btn-ghost">
            {copy.archiveBackIndex}
          </Link>
          <Link href={withLang("/news")} className="mkt-btn mkt-btn-primary">
            {copy.archiveBackLive}
          </Link>
        </div>
      </section>
    </div>
  );
}
*/
