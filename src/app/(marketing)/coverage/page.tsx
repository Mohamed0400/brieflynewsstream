import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { groupCountryCodesByRegion } from "@/lib/supported-countries";
import {
  SITE_NAME,
  siteTitle,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  organizationJsonLd,
  pageMetadata,
} from "@/lib/seo";

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
      ? siteTitle("en", "Coverage")
      : siteTitle("ar", "التغطية"),
    description: isEn
      ? `Briefly NewsStream covers ${COUNTRY_CATALOG.length}+ countries with bilingual AR/EN market news across the Middle East, North Africa, Africa, Europe, the Americas, and Asia-Pacific markets.`
      : `Briefly NewsStream يغطي أكثر من ${COUNTRY_CATALOG.length} دولة بأخبار أسواق ثنائية اللغة عبر الشرق الأوسط وشمال أفريقيا وأفريقيا وأوروبا والأمريكتين وآسيا والمحيط الهادئ.`,
    path: "/coverage",
    pathEn: "/coverage?lang=en",
    keywords: [
      "Middle East news API",
      "MENA news API",
      "Gulf news API",
      "GCC news API",
      "Arabic speaking countries news API",
      "worldwide news API",
      "Egypt news API",
      "Saudi news API",
    ],
  });
}

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  const news = isEn ? "/news?lang=en" : "/news";
  const catalogCodes = COUNTRY_CATALOG.filter((c) => c.code !== "GLOBAL").map((c) => c.code);
  const regionGroups = groupCountryCodesByRegion(catalogCodes, lang);

  return (
    <div className="mkt-page" lang={isEn ? "en" : "ar"} dir={isEn ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          collectionPageJsonLd({
            name: isEn ? "News coverage" : "تغطية الأخبار",
            description: isEn
              ? "Country-level market news coverage for the Middle East, Arabic-speaking countries, and global markets."
              : "تغطية أخبار الأسواق حسب الدولة للشرق الأوسط والدول الناطقة بالعربية والأسواق العالمية.",
            path: "/coverage",
            lang,
          }),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: "/" },
            { name: isEn ? "Coverage" : "التغطية", path: "/coverage" },
          ]),
        ]}
      />
      <div className="mkt-section">
        <div className="mkt-section-head">
          <h1>
            {isEn
              ? `Coverage across ${COUNTRY_CATALOG.length} markets`
              : `تغطية عبر ${COUNTRY_CATALOG.length} سوقاً`}
          </h1>
          <p>
            {isEn
              ? "One consistent schema for Gulf and Middle East markets plus English-speaking and global coverage. Filter by country in the briefing or API."
              : "مخطط واحد لأسواق الخليج والشرق الأوسط إضافة إلى التغطية العالمية والناطقة بالإنجليزية. صفِّ حسب الدولة في الموجز أو الواجهة."}
          </p>
        </div>
        {regionGroups.map((group) => (
          <section key={group.key} className="mkt-coverage-region" aria-label={group.label}>
            <h2 className="mkt-coverage-region-title">
              {group.label} <span>({group.items.length})</span>
            </h2>
            <ul className="mkt-chip-list">
              {group.items.map((item) => (
                <li key={item.code}>
                  <Link
                    className="mkt-chip"
                    href={`${news}${news.includes("?") ? "&" : "?"}country=${item.code}`}
                  >
                    {item.name} ({item.code})
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="mkt-coverage-region" aria-label={isEn ? "Regional hubs" : "مراكز إقليمية"}>
          <h2 className="mkt-coverage-region-title">
            {isEn ? "Regional hubs" : "مراكز إقليمية"}
          </h2>
          <ul className="mkt-chip-list">
            {(
              [
                ["mena", isEn ? "MENA" : "الشرق الأوسط وشمال أفريقيا"],
                ["gcc", isEn ? "GCC" : "الخليج"],
                ["europe", isEn ? "Europe" : "أوروبا"],
                ["saudi-arabia", isEn ? "Saudi Arabia" : "السعودية"],
                ["uae", isEn ? "UAE" : "الإمارات"],
                ["egypt", isEn ? "Egypt" : "مصر"],
                ["united-kingdom", isEn ? "United Kingdom" : "المملكة المتحدة"],
                ["germany", isEn ? "Germany" : "ألمانيا"],
                ["france", isEn ? "France" : "فرنسا"],
              ] as const
            ).map(([slug, label]) => (
              <li key={slug}>
                <Link
                  className="mkt-chip"
                  href={isEn ? `/markets/${slug}?lang=en` : `/markets/${slug}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <div className="mkt-cta-row" style={{ marginTop: "2rem" }}>
          <Link href={news} className="mkt-btn mkt-btn-primary">
            {isEn ? "Open briefing" : "افتح الموجز"}
          </Link>
          <Link href={isEn ? "/guides?lang=en" : "/guides"} className="mkt-btn mkt-btn-ghost">
            {isEn ? "Guides" : "أدلة"}
          </Link>
        </div>
      </div>
    </div>
  );
}
