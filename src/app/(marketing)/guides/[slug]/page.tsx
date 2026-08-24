import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDES, guideBySlug } from "@/lib/guides";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  pageMetadata,
  siteTitle,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) return {};
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  return pageMetadata({
    lang,
    title: siteTitle(lang, isEn ? guide.titleEn : guide.titleAr),
    description: (isEn ? guide.ledeEn : guide.ledeAr).slice(0, 160),
    path: `/guides/${guide.slug}`,
    pathEn: `/guides/${guide.slug}?lang=en`,
    keywords: ["market intelligence API", guide.slug.replaceAll("-", " ")],
  });
}

export default async function GuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();

  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const isEn = lang === "en";
  const sections = isEn ? guide.sectionsEn : guide.sectionsAr;
  const path = `/guides/${guide.slug}`;

  return (
    <div className="mkt-page" lang={isEn ? "en" : "ar"} dir={isEn ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          webPageJsonLd({
            lang,
            name: isEn ? guide.titleEn : guide.titleAr,
            description: isEn ? guide.ledeEn : guide.ledeAr,
            path,
            speakableCssSelectors: ["h1", "[data-aeo-answer]", ".mkt-guide-section"],
          }),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: "/" },
            { name: isEn ? "Guides" : "أدلة", path: "/guides" },
            { name: isEn ? guide.titleEn : guide.titleAr, path },
          ]),
        ]}
      />
      <article className="mkt-section mkt-guide">
        <div className="mkt-section-head">
          <h1>{isEn ? guide.titleEn : guide.titleAr}</h1>
          <p data-aeo-answer>{isEn ? guide.ledeEn : guide.ledeAr}</p>
        </div>
        {sections.map((section) => (
          <section key={section.h} className="mkt-guide-section">
            <h2>{section.h}</h2>
            <p>{section.p}</p>
          </section>
        ))}
        <div className="mkt-cta-row">
          <Link
            href={isEn ? "/console/signup?lang=en" : "/console/signup"}
            className="mkt-btn mkt-btn-primary"
          >
            {isEn ? "Start free" : "ابدأ مجاناً"}
          </Link>
          <Link href={isEn ? "/guides?lang=en" : "/guides"} className="mkt-btn mkt-btn-ghost">
            {isEn ? "All guides" : "كل الأدلة"}
          </Link>
        </div>
      </article>
    </div>
  );
}
