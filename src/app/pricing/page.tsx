import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  SITE_NAME,
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
      ? `News API Pricing | Free, Pro $60, Enterprise | ${SITE_NAME}`
      : `أسعار واجهة الأخبار | مجاني وPro وEnterprise | ${SITE_NAME}`,
    description: isEn
      ? "Briefly NewsStream news API pricing: Free to evaluate, Pro at $60/month list price, Enterprise custom. Manual upgrades, no checkout yet. Arabic-first bilingual market news API."
      : "أسعار Briefly NewsStream: مجاني للتجربة، Pro بسعر ٦٠ دولاراً شهرياً، وEnterprise مخصص. ترقيات يدوية بدون دفع إلكتروني بعد.",
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
  const isEn = lang === "en";
  const home = isEn ? "/?lang=en" : "/";
  const signup = isEn ? "/console/login?lang=en" : "/console/login";

  const plans = isEn
    ? [
        {
          name: "Free",
          price: "$0",
          body: "Evaluate the bilingual market news API with console access and a daily request cap.",
        },
        {
          name: "Pro",
          price: "$60 / month",
          body: "Production quotas, full filters, community briefings, and commercial use. Upgraded by admin.",
        },
        {
          name: "Enterprise",
          price: "Custom",
          body: "Volume, SLA, and support tailored to your team. Contact sales to scope.",
        },
      ]
    : [
        {
          name: "مجاني",
          price: "$0",
          body: "جرّب واجهة أخبار الأسواق ثنائية اللغة مع لوحة المطوّر وحد يومي للطلبات.",
        },
        {
          name: "Pro",
          price: "$60 / شهر",
          body: "حصص إنتاجية وفلاتر كاملة وإحاطات مجتمعية واستخدام تجاري. الترقية عبر المسؤول.",
        },
        {
          name: "Enterprise",
          price: "مخصص",
          body: "حجم وSLA ودعم حسب فريقك. تواصل مع المبيعات لتحديد النطاق.",
        },
      ];

  return (
    <main className="mkt" lang={isEn ? "en" : "ar"} dir={isEn ? "ltr" : "rtl"}>
      <JsonLd
        data={[
          organizationJsonLd(),
          softwareApplicationJsonLd(lang),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: "/" },
            { name: isEn ? "Pricing" : "الأسعار", path: "/pricing" },
          ]),
        ]}
      />
      <div className="mkt-section" style={{ paddingTop: "3rem" }}>
        <p>
          <Link href={home}>{SITE_NAME}</Link>
          {" / "}
          <span>{isEn ? "Pricing" : "الأسعار"}</span>
        </p>
        <div className="mkt-section-head">
          <h1>{isEn ? "News API pricing" : "أسعار واجهة الأخبار"}</h1>
          <p>
            {isEn
              ? "Simple plans for a bilingual market news API serving English-speaking teams and the Gulf / Middle East. No self-serve checkout yet. Contact us to upgrade."
              : "خطط بسيطة لواجهة أخبار أسواق ثنائية اللغة للفرق الناطقة بالإنجليزية والخليج والشرق الأوسط. لا دفع ذاتي بعد. تواصل للترقية."}
          </p>
        </div>
        <div className="mkt-price-grid">
          {plans.map((plan) => (
            <article key={plan.name} className="mkt-price">
              <h2>{plan.name}</h2>
              <p className="mkt-price-amount">{plan.price}</p>
              <p>{plan.body}</p>
            </article>
          ))}
        </div>
        <div className="mkt-cta-row" style={{ marginTop: "2rem" }}>
          <Link href={signup} className="mkt-btn mkt-btn-primary">
            {isEn ? "Get API key" : "احصل على مفتاح API"}
          </Link>
          <a href="mailto:hello@brieflynewsstream.com" className="mkt-btn mkt-btn-ghost">
            {isEn ? "Contact sales" : "تواصل مع المبيعات"}
          </a>
        </div>
      </div>
    </main>
  );
}
