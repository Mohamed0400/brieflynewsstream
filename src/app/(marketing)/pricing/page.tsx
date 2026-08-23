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
      ? siteTitle("en", "Pricing")
      : siteTitle("ar", "الأسعار"),
    description: isEn
      ? `Start free at ${PLAN_DEFINITIONS.FREE.dailyRequests} API requests a day. Pro is $${PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd} per month with ${PLAN_DEFINITIONS.PRO.dailyRequests} requests. Enterprise is custom, with ${PLAN_DEFINITIONS.ENTERPRISE.dailyRequests} requests a day by default.`
      : `ابدأ مجاناً بـ ${PLAN_DEFINITIONS.FREE.dailyRequests} طلبات API يومياً. Pro بسعر ${PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd} دولاراً شهرياً و${PLAN_DEFINITIONS.PRO.dailyRequests} طلب. Enterprise تسعير مخصص بحد ${PLAN_DEFINITIONS.ENTERPRISE.dailyRequests} طلب يومياً افتراضياً.`,
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
