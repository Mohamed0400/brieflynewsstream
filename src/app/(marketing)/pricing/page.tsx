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
      ? `Start free at ${PLAN_DEFINITIONS.FREE.dailyRequests}/day, ${PLAN_DEFINITIONS.FREE.monthlyRequests}/month, and ${PLAN_DEFINITIONS.FREE.yearlyRequests}/year. Pro is $${PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd}/month with ${PLAN_DEFINITIONS.PRO.dailyRequests} requests a day. Enterprise is $${PLAN_DEFINITIONS.ENTERPRISE.listPriceMonthlyUsd}/month with ${PLAN_DEFINITIONS.ENTERPRISE.dailyRequests} a day.`
      : `ابدأ مجاناً بـ ${PLAN_DEFINITIONS.FREE.dailyRequests}/يوم، و${PLAN_DEFINITIONS.FREE.monthlyRequests}/شهر، و${PLAN_DEFINITIONS.FREE.yearlyRequests}/سنة. Pro بسعر ${PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd} دولاراً شهرياً و${PLAN_DEFINITIONS.PRO.dailyRequests} طلب يومياً. Enterprise بسعر ${PLAN_DEFINITIONS.ENTERPRISE.listPriceMonthlyUsd} دولاراً شهرياً و${PLAN_DEFINITIONS.ENTERPRISE.dailyRequests} طلب يومياً.`,
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
          ? `Free includes ${free.dailyRequests}/day, ${free.monthlyRequests}/month, and ${free.yearlyRequests}/year. Pro is $${pro.listPriceMonthlyUsd} per month. Enterprise is $${PLAN_DEFINITIONS.ENTERPRISE.listPriceMonthlyUsd} per month.`
          : `المجاني يشمل ${free.dailyRequests}/يوم، و${free.monthlyRequests}/شهر، و${free.yearlyRequests}/سنة. سعر Pro هو ${pro.listPriceMonthlyUsd} دولاراً شهرياً. سعر Enterprise هو ${PLAN_DEFINITIONS.ENTERPRISE.listPriceMonthlyUsd} دولاراً شهرياً.`}
      </p>
    </div>
  );
}
