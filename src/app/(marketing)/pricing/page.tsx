import type { Metadata } from "next";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { JsonLd } from "@/components/seo/JsonLd";
import { marketingCopy } from "@/lib/marketing-copy";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { pricingCopy } from "@/lib/pricing-copy";
import {
  SITE_NAME,
  siteTitle,
  breadcrumbJsonLd,
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
      ? siteTitle("en", "Pricing")
      : siteTitle("ar", "الأسعار"),
    description: isEn
      ? "Start free at 5 API requests a day. Pro is $70 per month with 20,000 requests. Enterprise is custom. No checkout yet."
      : "ابدأ مجاناً بـ 5 طلبات API يومياً. Pro بسعر 70 دولاراً شهرياً و20,000 طلب. Enterprise تسعير مخصص. لا دفع إلكتروني بعد.",
    path: "/pricing",
    pathEn: "/pricing?lang=en",
    keywords: [
      "news API pricing",
      "free news API",
      "Pro news API",
      "market news API pricing",
      "Arabic news API pricing",
    ],
  });
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const copy = pricingCopy(lang);
  const nav = marketingCopy(lang);
  const free = PLAN_DEFINITIONS.FREE;
  const pro = PLAN_DEFINITIONS.PRO;

  return (
    <div className="mkt-page" lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          softwareApplicationJsonLd(lang),
          breadcrumbJsonLd([
            { name: nav.footerHome, path: "/" },
            { name: nav.navPricing, path: "/pricing" },
          ]),
        ]}
      />
      <div className="mkt-section mkt-pricing-page">
        <div className="mkt-section-head">
          <h1>{copy.pageTitle}</h1>
          <p>{copy.pageLede}</p>
        </div>
        <PricingPlans lang={lang} variant="full" />
      </div>
      <p className="mkt-sr">
        {lang === "en"
          ? `Free includes ${free.dailyRequests} requests a day. Pro list price is $${pro.listPriceMonthlyUsd} per month with ${pro.dailyRequests} requests a day.`
          : `المجاني يشمل ${free.dailyRequests} طلباً يومياً. سعر Pro هو ${pro.listPriceMonthlyUsd} دولاراً شهرياً مع ${pro.dailyRequests} طلباً يومياً.`}
      </p>
    </div>
  );
}
