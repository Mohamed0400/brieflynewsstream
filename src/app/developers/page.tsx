import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  SITE_NAME,
  breadcrumbJsonLd,
  howToGetApiKeyJsonLd,
  organizationJsonLd,
  pageMetadata,
  softwareApplicationJsonLd,
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
      ? `Developers | JSON News API for Kuwait & MENA | ${SITE_NAME}`
      : `للمطوّرين | واجهة JSON أخبار للكويت والشرق الأوسط | ${SITE_NAME}`,
    description: isEn
      ? "Build with the Briefly NewsStream JSON news API: bilingual AR/EN market news for Kuwait, Middle East, and Arabic-speaking markets—impact scores, filters, OpenAPI, and console keys."
      : "ابنِ مع واجهة Briefly NewsStream: أخبار أسواق ثنائية اللغة للكويت والشرق الأوسط والدول الناطقة بالعربية—درجات أثر، فلاتر، OpenAPI، ومفاتيح اللوحة.",
    path: "/developers",
    pathEn: "/developers?lang=en",
    keywords: [
      "news API for developers",
      "Kuwait news API",
      "MENA news API",
      "JSON news API",
      "REST news API",
      "Arabic news API",
      "news API key",
    ],
  });
}

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  const home = isEn ? "/?lang=en" : "/";
  const docs = isEn ? "/console/docs/api?lang=en" : "/console/docs/api";
  const consoleHref = isEn ? "/console?lang=en" : "/console";
  const openapi = "/api/v1/openapi.json";

  const points = isEn
    ? [
        {
          title: "REST + JSON",
          body: "Send X-API-Key and query market news with category, country, language, date, and impact sort.",
        },
        {
          title: "Bilingual fields",
          body: "Every article can return Arabic and English titles and summaries for Kuwait, Middle East, Arabic-speaking markets, and global products.",
        },
        {
          title: "Developer console",
          body: "Create account keys, explore endpoints, and read quick-start docs in one workspace.",
        },
      ]
    : [
        {
          title: "REST + JSON",
          body: "أرسل X-API-Key واستعلم عن أخبار الأسواق بالفئة والدولة واللغة والتاريخ وترتيب الأثر.",
        },
        {
          title: "حقول ثنائية اللغة",
          body: "كل مقال يمكن أن يعيد عناوين وملخصات بالعربية والإنجليزية لمنتجات الكويت والشرق الأوسط والدول الناطقة بالعربية والعالم.",
        },
        {
          title: "لوحة المطوّر",
          body: "أنشئ مفاتيح الحساب، استكشف المسارات، واقرأ البداية السريعة في مساحة عمل واحدة.",
        },
      ];

  return (
    <main className="mkt" lang={isEn ? "en" : "ar"} dir={isEn ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          softwareApplicationJsonLd(lang),
          howToGetApiKeyJsonLd(lang),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: "/" },
            { name: isEn ? "Developers" : "للمطوّرين", path: "/developers" },
          ]),
        ]}
      />
      <div className="mkt-section" style={{ paddingTop: "3rem" }}>
        <p>
          <Link href={home}>{SITE_NAME}</Link>
          {" / "}
          <span>{isEn ? "Developers" : "للمطوّرين"}</span>
        </p>
        <div className="mkt-section-head">
          <h1>{isEn ? "News API for developers" : "واجهة الأخبار للمطوّرين"}</h1>
          <p>
            {isEn
              ? "A professional JSON news API for market products: bilingual payloads, impact ranking, and a real developer console."
              : "واجهة JSON احترافية لمنتجات الأسواق: استجابات ثنائية اللغة وترتيب بالأثر ولوحة مطوّر حقيقية."}
          </p>
        </div>
        <div className="mkt-pillar-grid">
          {points.map((item) => (
            <article key={item.title} className="mkt-pillar">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <pre className="mkt-code" tabIndex={0} style={{ marginTop: "2rem" }}>
          <code>{`curl -H "X-API-Key: YOUR_KEY" \\
  "https://brieflynewsstream.com/api/v1/market-news?lang=en&limit=5"`}</code>
        </pre>
        <div className="mkt-cta-row" style={{ marginTop: "1.5rem" }}>
          <Link href={consoleHref} className="mkt-btn mkt-btn-primary">
            {isEn ? "Open console" : "افتح اللوحة"}
          </Link>
          <Link href={docs} className="mkt-btn mkt-btn-ghost">
            {isEn ? "API docs" : "توثيق API"}
          </Link>
          <Link href={openapi} className="mkt-btn mkt-btn-ghost">
            OpenAPI
          </Link>
        </div>
      </div>
    </main>
  );
}
