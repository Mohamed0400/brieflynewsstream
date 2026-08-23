import Link from "next/link";
import { BrandLogo } from "@/components/media/BrandLogo";
import type { MarketingLang } from "@/lib/marketing-copy";
import { withMarketingLang } from "@/lib/marketing-nav";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { PRICING_CONTACT, pricingCopy } from "@/lib/pricing-copy";

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function mailto(subject: string) {
  return `mailto:${PRICING_CONTACT}?subject=${encodeURIComponent(subject)}`;
}

export function PricingPlans({
  lang,
  variant,
}: {
  lang: MarketingLang;
  variant: "compact" | "full";
}) {
  const copy = pricingCopy(lang);
  const signupHref = withMarketingLang("/console/signup", lang);
  const detailsHref = withMarketingLang("/pricing", lang);
  const free = PLAN_DEFINITIONS.FREE;
  const pro = PLAN_DEFINITIONS.PRO;
  const enterprise = PLAN_DEFINITIONS.ENTERPRISE;
  const faqs = [
    { q: copy.faqRequestQ, a: copy.faqRequestA },
    { q: copy.faqResetQ, a: copy.faqResetA },
    { q: copy.faqFreeQ, a: copy.faqFreeA },
    { q: copy.faqPayQ, a: copy.faqPayA },
    { q: copy.faqSlaQ, a: copy.faqSlaA },
    { q: copy.faqArchiveQ, a: copy.faqArchiveA },
  ];
  const included = [
    {
      titleEm: copy.included1TitleEm,
      titleRest: copy.included1TitleRest,
      body: copy.included1Body,
      bodyEm: copy.included1BodyEm,
      bodyTail: copy.included1BodyTail,
    },
    {
      titleEm: copy.included2TitleEm,
      titleRest: copy.included2TitleRest,
      body: copy.included2Body,
      bodyEm: copy.included2BodyEm,
      bodyTail: copy.included2BodyTail,
    },
    {
      titleEm: copy.included3TitleEm,
      titleRest: copy.included3TitleRest,
      body: copy.included3Body,
      bodyEm: copy.included3BodyEm,
      bodyTail: copy.included3BodyTail,
    },
    {
      titleEm: copy.included4TitleEm,
      titleRest: copy.included4TitleRest,
      body: copy.included4Body,
      bodyEm: copy.included4BodyEm,
      bodyTail: copy.included4BodyTail,
    },
    {
      titleEm: copy.included5TitleEm,
      titleRest: copy.included5TitleRest,
      body: copy.included5Body,
      bodyEm: copy.included5BodyEm,
      bodyTail: copy.included5BodyTail,
    },
    {
      titleEm: copy.included6TitleEm,
      titleRest: copy.included6TitleRest,
      body: copy.included6Body,
      bodyEm: copy.included6BodyEm,
      bodyTail: copy.included6BodyTail,
    },
  ];
  const startSteps = [copy.startStep1, copy.startStep2, copy.startStep3];
  const freeFeatures = [copy.featureFree1, copy.featureFree2, copy.featureFree3, copy.featureFree4];
  const proFeatures = [
    `${formatCount(pro.dailyRequests)} ${copy.featureQuotaUnit}`,
    copy.featureProCommercial,
    copy.featureProBilling,
  ];
  const entFeatures = [
    `${formatCount(enterprise.dailyRequests)} ${copy.featureQuotaUnit}${copy.featureEntQuotaNote}`,
    `${copy.featureEntKeysPrefix}${formatCount(enterprise.maxKeys)}${copy.featureEntKeysSuffix}`,
    copy.featureEntSla,
    copy.featureEntCustom,
  ];
  const compactFeatures = variant === "compact";
  const PlanHeading = variant === "full" ? "h2" : "h3";

  return (
    <div className={`mkt-plans ${variant === "full" ? "mkt-plans-full" : "mkt-plans-compact"}`}>
      <div className="mkt-plan-pair">
        <article className="mkt-plan">
          <PlanHeading>{copy.planFree}</PlanHeading>
          <p className="mkt-plan-for">{copy.forFree}</p>
          <p className="mkt-price-amount">
            ${free.listPriceMonthlyUsd}
            <span>{copy.periodMonth}</span>
          </p>
          <div className="mkt-plan-cta">
            <Link href={signupHref} className="mkt-btn mkt-btn-ghost">
              {copy.ctaStart}
            </Link>
          </div>
          <PlanMeters
            copy={copy}
            requests={free.dailyRequests}
            keys={free.maxKeys}
            license={free.commercialUse ? copy.licenseCommercial : copy.licenseEval}
            sla={copy.slaNone}
            compact={compactFeatures}
          />
          <ul className="mkt-plan-features">
            {(compactFeatures ? freeFeatures.slice(0, 3) : freeFeatures).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="mkt-plan mkt-plan-featured">
          <PlanHeading className="mkt-plan-name">{copy.planPro}</PlanHeading>
          <p className="mkt-plan-for">{copy.forPro}</p>
          <p className="mkt-price-amount">
            ${pro.listPriceMonthlyUsd}
            <span>{copy.periodMonth}</span>
          </p>
          <div className="mkt-plan-cta">
            {variant === "compact" ? (
              <Link href={signupHref} className="mkt-btn mkt-btn-primary">
                {copy.ctaStart}
              </Link>
            ) : (
              <Link href={signupHref} className="mkt-btn mkt-btn-primary">
                {copy.ctaPro}
              </Link>
            )}
          </div>
          <PlanMeters
            copy={copy}
            requests={pro.dailyRequests}
            keys={pro.maxKeys}
            license={pro.commercialUse ? copy.licenseCommercial : copy.licenseEval}
            sla={copy.slaNone}
            compact={compactFeatures}
          />
          <ul className="mkt-plan-features">
            {(compactFeatures ? proFeatures.slice(0, 3) : proFeatures).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="mkt-plan">
          <PlanHeading>{copy.planEnterprise}</PlanHeading>
          <p className="mkt-plan-for">{copy.forEnterprise}</p>
          <p className="mkt-price-amount">{copy.customPrice}</p>
          <div className="mkt-plan-cta">
            <a href={mailto("Enterprise plan")} className="mkt-btn mkt-btn-ghost">
              {copy.ctaEnterprise}
            </a>
          </div>
          <PlanMeters
            copy={copy}
            requests={enterprise.dailyRequests}
            keys={enterprise.maxKeys}
            license={enterprise.commercialUse ? copy.licenseCommercial : copy.licenseEval}
            sla={copy.slaScoped}
            compact={compactFeatures}
          />
          <ul className="mkt-plan-features">
            {(compactFeatures ? entFeatures.slice(0, 3) : entFeatures).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <p className="mkt-plan-hint">{copy.meterHint}</p>

      {variant === "compact" ? (
        <p className="mkt-plan-more">
          <Link href={detailsHref}>{copy.compareHref}</Link>
        </p>
      ) : null}

      {variant === "full" ? (
        <>
          <section className="mkt-included" aria-labelledby="mkt-included-title">
            <div className="mkt-section-head">
              <h2 id="mkt-included-title">{copy.includedTitle}</h2>
              <p>{copy.includedLede}</p>
            </div>
            <ul className="mkt-included-grid">
              {included.map((item) => (
                <li key={item.titleEm}>
                  <h3>
                    <span className="mkt-included-em">{item.titleEm}</span>
                    {item.titleRest ? (
                      <span className="mkt-included-rest">{item.titleRest}</span>
                    ) : null}
                  </h3>
                  <p>
                    {item.body}
                    {item.bodyEm ? (
                      <span className="mkt-included-body-em">{item.bodyEm}</span>
                    ) : null}
                    {item.bodyTail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mkt-start" aria-labelledby="mkt-start-title">
            <div className="mkt-section-head">
              <h2 id="mkt-start-title">{copy.startTitle}</h2>
              <p>{copy.startLede}</p>
            </div>
            <ol className="mkt-start-steps">
              {startSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="mkt-faq" aria-labelledby="mkt-billing-faq">
            <div className="mkt-section-head">
              <h2 id="mkt-billing-faq">{copy.faqTitle}</h2>
            </div>
            <div className="mkt-faq-list">
              {faqs.map((item) => (
                <details key={item.q} className="mkt-faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mkt-pricing-close" aria-labelledby="mkt-pricing-close-title">
            <div className="mkt-pricing-close-copy">
              <span className="mkt-pricing-close-mark" aria-hidden="true">
                <BrandLogo variant="mark" />
              </span>
              <h2 id="mkt-pricing-close-title">{copy.nextTitle}</h2>
              <p>{copy.nextLede}</p>
              <p>{copy.nextProof}</p>
            </div>
            <Link href={signupHref} className="mkt-btn mkt-btn-primary mkt-pricing-close-cta">
              {copy.ctaStart}
            </Link>
          </section>
        </>
      ) : null}
    </div>
  );
}

function PlanMeters({
  copy,
  requests,
  keys,
  license,
  sla,
  compact = false,
}: {
  copy: ReturnType<typeof pricingCopy>;
  requests: number;
  keys: number;
  license: string;
  sla: string;
  compact?: boolean;
}) {
  return (
    <dl className="mkt-plan-meters">
      <div>
        <dt>{copy.meterRequests}</dt>
        <dd>
          {formatCount(requests)} {copy.requestsUnit}
        </dd>
      </div>
      <div>
        <dt>{copy.meterKeys}</dt>
        <dd>{formatCount(keys)}</dd>
      </div>
      {compact ? null : (
        <>
          <div>
            <dt>{copy.meterLicense}</dt>
            <dd>{license}</dd>
          </div>
          <div>
            <dt>{copy.meterSla}</dt>
            <dd>{sla}</dd>
          </div>
        </>
      )}
    </dl>
  );
}
