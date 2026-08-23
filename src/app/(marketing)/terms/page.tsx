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

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const copy = legalCopy(lang, "terms");
  return pageMetadata({
    lang,
    title: siteTitle(lang, copy.title),
    description: copy.lede,
    path: "/terms",
    pathEn: "/terms?lang=en",
    keywords: ["terms of use", "API terms", "developer terms"],
  });
}

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const nav = marketingCopy(lang);
  const copy = legalCopy(lang, "terms");

  return (
    <div lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          webPageJsonLd({
            lang,
            name: copy.title,
            description: copy.lede,
            path: lang === "en" ? "/terms?lang=en" : "/terms",
            speakableCssSelectors: [".mkt-section-head h1", ".mkt-legal-block p"],
          }),
          breadcrumbJsonLd([
            { name: nav.footerHome, path: "/" },
            { name: copy.title, path: "/terms" },
          ]),
        ]}
      />
      <LegalDoc lang={lang} kind="terms" />
    </div>
  );
}
