import { MarketingDevelopers } from "@/components/marketing/MarketingDevelopers";
import { JsonLd } from "@/components/seo/JsonLd";
import { developersCopy } from "@/lib/developers-copy";
import { marketingCopy } from "@/lib/marketing-copy";
import {
  siteTitle,
  breadcrumbJsonLd,
  faqJsonLd,
  howToGetApiKeyJsonLd,
  organizationJsonLd,
  pageMetadata,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";

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
      ? siteTitle("en", "Developers")
      : siteTitle("ar", "للمطوّرين"),
    description: isEn
      ? "How to use the Briefly market news API: create a key, send GET /market-news, filter by country and category, and read bilingual JSON with impact scores."
      : "كيف تستخدم واجهة Briefly لأخبار الأسواق: أنشئ مفتاحاً، أرسل GET /market-news، فلتر حسب الدولة والفئة، واقرأ JSON بالعربية والإنجليزية مع درجات التأثير.",
    path: "/developers",
    pathEn: "/developers?lang=en",
    keywords: [
      "news API for developers",
      "JSON news API",
      "REST news API",
      "Arabic news API",
      "news API key",
      "market news API",
      "MENA news API",
    ],
  });
}

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const copy = developersCopy(lang);
  const nav = marketingCopy(lang);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          softwareApplicationJsonLd(lang),
          howToGetApiKeyJsonLd(lang),
          faqJsonLd([
            { question: copy.faqKeyQ, answer: copy.faqKeyA },
            { question: copy.faqScoreQ, answer: copy.faqScoreA },
            { question: copy.faqPageQ, answer: copy.faqPageA },
            { question: copy.faqWindowQ, answer: copy.faqWindowA },
          ]),
          breadcrumbJsonLd([
            { name: nav.footerHome, path: "/" },
            { name: nav.navDevelopers, path: "/developers" },
          ]),
        ]}
      />
      <MarketingDevelopers lang={lang} />
    </>
  );
}
