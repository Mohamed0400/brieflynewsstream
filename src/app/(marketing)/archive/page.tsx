// Archive route disabled — cold storage / R2 integration not working yet.
import { notFound } from "next/navigation";

export default function ArchiveIndexPageDisabled() {
  notFound();
}

/*
import Link from "next/link";
import type { Metadata } from "next";
import { listArchiveDays } from "@/lib/archive/reader";
import { marketingCopy, type MarketingLang } from "@/lib/marketing-copy";
import { withMarketingLang } from "@/lib/marketing-nav";
import { pageMetadata, siteTitle } from "@/lib/seo";

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
    title: isEn ? siteTitle("en", "Archive") : siteTitle("ar", "الأرشيف"),
    description: isEn
      ? "Browse market news archived beyond the live 5-day window."
      : "تصفح أخبار الأسواق المؤرشفة بعد نافذة الأيام الخمسة الحية.",
    path: "/archive",
    pathEn: "/archive?lang=en",
  });
}

export default async function ArchiveIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = ((await searchParams).lang === "en" ? "en" : "ar") as MarketingLang;
  const copy = marketingCopy(lang);
  const withLang = (path: string) => withMarketingLang(path, lang);
  const listed = await listArchiveDays();

  return (
    <div className="mkt-page">
      <section className="mkt-section">
        <div className="mkt-section-head">
          <p className="mkt-kicker">{copy.archiveKicker}</p>
          <h1>{copy.archiveTitle}</h1>
          <p>{copy.archiveLede}</p>
        </div>

        {!listed.configured ? (
          <p className="mkt-muted">{copy.archiveNotConfigured}</p>
        ) : listed.days.length === 0 ? (
          <p className="mkt-muted">{copy.archiveEmpty}</p>
        ) : (
          <ul className="mkt-archive-days">
            {listed.days.map((day) => (
              <li key={day.date}>
                <Link href={withLang(`/archive/${day.date}`)}>
                  <strong>{day.date}</strong>
                  <span>{copy.archiveDayCount(day.articleCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mkt-cta-row" style={{ marginTop: "1.5rem" }}>
          <Link href={withLang("/news")} className="mkt-btn mkt-btn-ghost">
            {copy.archiveBackLive}
          </Link>
        </div>
      </section>
    </div>
  );
}
*/
