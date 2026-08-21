import type { Metadata } from "next";
import { LegalDoc } from "@/components/marketing/LegalDoc";
import { JsonLd } from "@/components/seo/JsonLd";
import { legalCopy } from "@/lib/legal-copy";
import { marketingCopy } from "@/lib/marketing-copy";
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
  const copy = legalCopy(lang, "privacy");
  return pageMetadata({
    lang,
    title: siteTitle(lang, copy.title),
    description: copy.lede,
    path: "/privacy",
    pathEn: "/privacy?lang=en",
    keywords: ["privacy", "data protection", "API privacy"],
  });
}

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const nav = marketingCopy(lang);
  const copy = legalCopy(lang, "privacy");

  return (
    <div lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          webPageJsonLd({
            lang,
            name: copy.title,
            description: copy.lede,
            path: lang === "en" ? "/privacy?lang=en" : "/privacy",
            speakableCssSelectors: [".mkt-section-head h1", ".mkt-legal-block p"],
          }),
          breadcrumbJsonLd([
            { name: nav.footerHome, path: "/" },
            { name: copy.title, path: "/privacy" },
          ]),
        ]}
      />
      <LegalDoc lang={lang} kind="privacy" />
    </div>
  );
}
