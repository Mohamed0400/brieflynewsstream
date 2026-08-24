import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDES } from "@/lib/guides";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  pageMetadata,
  siteTitle,
  webPageJsonLd,
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
    title: siteTitle(lang, isEn ? "Guides" : "أدلة"),
    description: isEn
      ? "Citeable guides on market intelligence APIs, bilingual MENA feeds, and impact scoring for products."
      : "أدلة قابلة للاستشهاد حول واجهات ذكاء الأسواق وموجزات الشرق الأوسط الثنائية اللغة ودرجات الأثر للمنتجات.",
    path: "/guides",
    pathEn: "/guides?lang=en",
    keywords: ["market intelligence API", "MENA news API guide", "impact scoring news"],
  });
}

export default async function GuidesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";

  return (
    <div className="mkt-page" lang={isEn ? "en" : "ar"} dir={isEn ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          webPageJsonLd({
            lang,
            name: isEn ? "Guides" : "أدلة",
            description: isEn
              ? "Market intelligence guides for product teams."
              : "أدلة ذكاء الأسواق لفرق المنتجات.",
            path: "/guides",
          }),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: "/" },
            { name: isEn ? "Guides" : "أدلة", path: "/guides" },
          ]),
        ]}
      />
      <section className="mkt-section">
        <div className="mkt-section-head">
          <h1>{isEn ? "Guides" : "أدلة"}</h1>
          <p>
            {isEn
              ? "Short, citeable explainers for teams building on market news."
              : "شروحات قصيرة قابلة للاستشهاد لفرق تبني على أخبار الأسواق."}
          </p>
        </div>
        <ul className="mkt-guide-list">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link href={isEn ? `/guides/${guide.slug}?lang=en` : `/guides/${guide.slug}`}>
                <h2>{isEn ? guide.titleEn : guide.titleAr}</h2>
                <p>{isEn ? guide.ledeEn : guide.ledeAr}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
