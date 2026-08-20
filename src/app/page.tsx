import { MarketingLanding } from "@/components/marketing/MarketingLanding";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { marketingCopy } from "@/lib/marketing-copy";
import { prisma } from "@/lib/prisma";
import { publicSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const copy = marketingCopy(lang);
  const path = lang === "en" ? "/?lang=en" : "/";
  return {
    title: {
      absolute: `${copy.brand} — ${copy.heroHeadline}`,
    },
    description: copy.heroLede,
    keywords: [
      "market news API",
      "Arabic news API",
      "bilingual news",
      "Briefly NewsStream",
      "impact scoring",
    ],
    alternates: {
      canonical: path,
      languages: {
        ar: "/",
        en: "/?lang=en",
        "x-default": "/",
      },
    },
    openGraph: {
      locale: lang === "ar" ? "ar" : "en_US",
      url: path,
      siteName: copy.brand,
      title: `${copy.brand} — ${copy.heroHeadline}`,
      description: copy.heroLede,
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.brand} — ${copy.heroHeadline}`,
      description: copy.heroLede,
    },
  };
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: copy.brand,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: publicSiteUrl(),
    description: copy.heroLede,
    inLanguage: ["ar", "en"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingLanding
        lang={lang}
        articlesIndexed={articlesIndexed}
        countriesCovered={COUNTRY_CATALOG.length}
      />
    </>
  );
}
