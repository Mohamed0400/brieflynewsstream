import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { COUNTRY_CATALOG } from "@/lib/countries";
import {
  SITE_NAME,
  siteTitle,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  organizationJsonLd,
  pageMetadata,
} from "@/lib/seo";

export const dynamic = "force-static";

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
      ? "Briefly NewsStream covers about 70 countries with bilingual AR/EN market news for Middle East, GCC, MENA, Arabic-speaking countries, and global markets."
      : "Briefly NewsStream يغطي نحو ٧٠ دولة بأخبار أسواق ثنائية اللغة للشرق الأوسط ومجلس التعاون والدول الناطقة بالعربية والعالم.",
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
  const sample = COUNTRY_CATALOG.filter((c) => c.code !== "GLOBAL").slice(0, 48);

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
        <ul className="mkt-chip-list">
          {sample.map((country) => (
            <li key={country.code}>
              <Link className="mkt-chip" href={`${news}${news.includes("?") ? "&" : "?"}country=${country.code}`}>
                {isEn ? country.country : country.nameAr} ({country.code})
              </Link>
            </li>
          ))}
        </ul>
        <div className="mkt-cta-row" style={{ marginTop: "2rem" }}>
          <Link href={news} className="mkt-btn mkt-btn-primary">
            {isEn ? "Open briefing" : "افتح الموجز"}
          </Link>
        </div>
      </div>
    </div>
  );
}
