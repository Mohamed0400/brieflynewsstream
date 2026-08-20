import { MarketingLanding } from "@/components/marketing/MarketingLanding";
import { JsonLd } from "@/components/seo/JsonLd";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { marketingCopy } from "@/lib/marketing-copy";
import { prisma } from "@/lib/prisma";
import {
  SITE_NAME,
  SEO_DESCRIPTION_AR,
  SEO_DESCRIPTION_EN,
  breadcrumbJsonLd,
  faqJsonLd,
  howToGetApiKeyJsonLd,
  organizationJsonLd,
  pageMetadata,
  serviceJsonLd,
  softwareApplicationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";

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
      ? `${SITE_NAME} | Market news API for Kuwait & Middle East`
      : `${SITE_NAME} | واجهة أخبار أسواق الكويت والشرق الأوسط`,
    description: isEn ? SEO_DESCRIPTION_EN : SEO_DESCRIPTION_AR,
    path: "/",
    pathEn: "/?lang=en",
    keywords: [
      "Briefly NewsStream",
      "Kuwait news API",
      "Middle East news API",
      "Arabic news API",
      "MENA news API",
      "Gulf news API",
      "market news API",
      "bilingual news API",
    ],
  });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const copy = marketingCopy(lang);
  const [articlesIndexed] = await Promise.all([
    prisma.article.count().catch(() => 0),
  ]);

  const faqs = [
    { question: copy.faqWhatQ, answer: copy.faqWhatA },
    { question: copy.faqWhereQ, answer: copy.faqWhereA },
    { question: copy.faqLangQ, answer: copy.faqLangA },
    { question: copy.faqImpactQ, answer: copy.faqImpactA },
    { question: copy.faqArchiveQ, answer: copy.faqArchiveA },
    { question: copy.faqKeyQ, answer: copy.faqKeyA },
    { question: copy.faqPayQ, answer: copy.faqPayA },
  ];

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(),
          webPageJsonLd({
            lang,
            name:
              lang === "en"
                ? `${SITE_NAME} | Market news API for Kuwait & Middle East`
                : `${SITE_NAME} | واجهة أخبار أسواق الكويت والشرق الأوسط`,
            description: lang === "en" ? SEO_DESCRIPTION_EN : SEO_DESCRIPTION_AR,
            path: "/",
            speakableCssSelectors: [
              "#mkt-hero-title",
              ".mkt-hero-lede",
              ".mkt-faq-item",
              "[data-aeo-answer]",
            ],
          }),
          softwareApplicationJsonLd(lang),
          serviceJsonLd(lang),
          howToGetApiKeyJsonLd(lang),
          faqJsonLd(faqs),
          breadcrumbJsonLd([{ name: lang === "en" ? "Home" : "الرئيسية", path: "/" }]),
        ]}
      />
      <MarketingLanding
        lang={lang}
        articlesIndexed={articlesIndexed}
        countriesCovered={COUNTRY_CATALOG.length}
      />
    </>
  );
}
