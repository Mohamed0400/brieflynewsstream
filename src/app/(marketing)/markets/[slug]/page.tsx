import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  MARKET_HUB_SLUGS,
  marketHubBySlug,
  marketHubCountryLabel,
} from "@/lib/market-hubs";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  organizationJsonLd,
  pageMetadata,
  siteTitle,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return MARKET_HUB_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = marketHubBySlug(slug);
  if (!hub) return {};
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  return pageMetadata({
    lang,
    title: siteTitle(lang, isEn ? hub.titleEn : hub.titleAr),
    description: (isEn ? hub.ledeEn : hub.ledeAr).slice(0, 160),
    path: `/markets/${hub.slug}`,
    pathEn: `/markets/${hub.slug}?lang=en`,
    keywords: hub.keywords,
  });
}

export default async function MarketHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const hub = marketHubBySlug(slug);
  if (!hub) notFound();

  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  const path = `/markets/${hub.slug}`;
  const newsBase = isEn ? "/news?lang=en" : "/news";
  const countryQuery = hub.countryCodes.join(",");
  const briefingHref = `${newsBase}${newsBase.includes("?") ? "&" : "?"}country=${countryQuery}`;
  const coverageHref = isEn ? "/coverage?lang=en" : "/coverage";
  const homeHref = isEn ? "/?lang=en" : "/";

  return (
    <div className="mkt-page" lang={isEn ? "en" : "ar"} dir={isEn ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          collectionPageJsonLd({
            name: isEn ? hub.titleEn : hub.titleAr,
            description: isEn ? hub.ledeEn : hub.ledeAr,
            path,
            lang,
          }),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: "/" },
            { name: isEn ? "Coverage" : "التغطية", path: "/coverage" },
            { name: isEn ? hub.titleEn : hub.titleAr, path },
          ]),
        ]}
      />
      <article className="mkt-section">
        <div className="mkt-section-head">
          <h1>{isEn ? hub.titleEn : hub.titleAr}</h1>
          <p data-aeo-answer>{isEn ? hub.ledeEn : hub.ledeAr}</p>
        </div>
        <p className="mkt-hub-body">{isEn ? hub.bodyEn : hub.bodyAr}</p>
        <p className="mkt-hub-markets">
          <strong>{isEn ? "Markets in this hub:" : "الأسواق في هذا المركز:"}</strong>{" "}
          {marketHubCountryLabel(hub, lang)}
        </p>
        <div className="mkt-cta-row">
          <Link href={briefingHref} className="mkt-btn mkt-btn-primary">
            {isEn ? "Open briefing" : "افتح الموجز"}
          </Link>
          <Link href={coverageHref} className="mkt-btn mkt-btn-ghost">
            {isEn ? "All coverage" : "كل التغطية"}
          </Link>
          <Link href={homeHref} className="mkt-btn mkt-btn-ghost">
            {isEn ? "Market Intelligence API" : "واجهة ذكاء أسواق"}
          </Link>
        </div>
        <p className="mkt-hub-query" dir="ltr" lang="en">
          <code>
            /api/v1/market-news?country={countryQuery}&amp;sort=score
          </code>
        </p>
      </article>
    </div>
  );
}
