import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  ChartLineUp,
  Check,
  Code,
  Globe,
  PlugsConnected,
  Stack,
  Translate,
} from "@phosphor-icons/react/ssr";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { marketingCopy, type MarketingLang } from "@/lib/marketing-copy";
import { marketingRegionPins } from "@/lib/region-coverage";

const demoJson = `{
  "category": "markets",
  "country": "GLOBAL",
  "title": "أسواق الأسهم العالمية تتماسك مع ترقّب قرارات الفائدة",
  "summary": "الأسواق تبقى منتظمة بينما ينتظر المتعاملون الخطوة التالية في السياسة النقدية.",
  "arabic": {
    "title": "أسواق الأسهم العالمية تتماسك مع ترقّب قرارات الفائدة",
    "summary": "الأسواق تبقى منتظمة بينما ينتظر المتعاملون الخطوة التالية في السياسة النقدية."
  },
  "english": {
    "title": "Global equities hold as desks watch the next rate decision",
    "summary": "Stock markets stay orderly while traders wait for the next move in policy."
  },
  "scores": {
    "final": 86,
    "marketImpact": 84
  }
}`;

const demoSectionJson = `{
  "category": "oil",
  "country": "GLOBAL",
  "title": "أسعار النفط تتراجع مع ترقّب مخزونات الطاقة العالمية",
  "summary": "خام القياس يتداول في نطاق ضيق بينما تترقّب الأسواق بيانات العرض والطلب.",
  "arabic": {
    "title": "أسعار النفط تتراجع مع ترقّب مخزونات الطاقة العالمية",
    "summary": "خام القياس يتداول في نطاق ضيق بينما تترقّب الأسواق بيانات العرض والطلب."
  },
  "english": {
    "title": "Oil prices ease as desks watch global energy inventories",
    "summary": "Benchmark crude trades in a tight range while markets wait on supply data."
  },
  "scores": {
    "final": 79,
    "marketImpact": 81
  }
}`;

const icon = { size: 28, weight: "regular" as const, "aria-hidden": true };

function ScoreBars({
  rows,
}: {
  rows: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <ul className="mkt-score-bars">
      {rows.map((row) => (
        <li key={row.label}>
          <span>{row.label}</span>
          <span className="mkt-score-track" aria-hidden="true">
            <span style={{ width: `${row.value}%` }} />
          </span>
          <strong>{row.value}</strong>
        </li>
      ))}
    </ul>
  );
}

export function MarketingLanding({
  lang,
}: {
  lang: MarketingLang;
}) {
  const copy = marketingCopy(lang);
  const withLang = (path: string) => (lang === "en" ? `${path}${path.includes("?") ? "&" : "?"}lang=en` : path);
  const docsHref = withLang("/developers");
  const signupHref = withLang("/console/signup");
  const briefingHref = withLang("/news");
  const regionPins = marketingRegionPins();
  const countryCount = COUNTRY_CATALOG.length;

  const signals = [
    { icon: <Stack {...icon} />, title: copy.provideLiveTitle, body: copy.provideLiveBody },
    { icon: <ChartLineUp {...icon} />, title: copy.provideArchiveTitle, body: copy.provideArchiveBody },
    { icon: <Code {...icon} />, title: copy.provideScoreTitle, body: copy.provideScoreBody },
  ];

  const capabilities = [
    { n: "01", icon: <ChartLineUp {...icon} />, title: copy.intelCap1Title, body: copy.intelCap1Body },
    { n: "02", icon: <Globe {...icon} />, title: copy.intelCap2Title, body: copy.intelCap2Body },
    { n: "03", icon: <Code {...icon} />, title: copy.intelCap3Title, body: copy.intelCap3Body },
    { n: "04", icon: <Translate {...icon} />, title: copy.intelCap4Title, body: copy.intelCap4Body },
    { n: "05", icon: <Archive {...icon} />, title: copy.intelCap5Title, body: copy.intelCap5Body },
    { n: "06", icon: <PlugsConnected {...icon} />, title: copy.intelCap6Title, body: copy.intelCap6Body },
  ];

  const roadmapItems = [
    { title: copy.roadmapEventTitle, body: copy.roadmapEventBody },
    { title: copy.roadmapAssetTitle, body: copy.roadmapAssetBody },
  ];

  const flowSteps = [
    { n: "01", title: copy.flowStep1Title, body: copy.flowStep1Body },
    { n: "02", title: copy.flowStep2Title, body: copy.flowStep2Body },
    { n: "03", title: copy.flowStep3Title, body: copy.flowStep3Body },
    { n: "04", title: copy.flowStep4Title, body: copy.flowStep4Body },
  ];

  const scores = [
    { label: copy.scoreGold, value: copy.scoreGoldValue },
    { label: copy.scoreRates, value: copy.scoreRatesValue },
    { label: copy.scoreMarket, value: copy.scoreMarketValue },
    { label: copy.scoreUsd, value: copy.scoreUsdValue },
    { label: copy.scoreOil, value: copy.scoreOilValue },
  ];

  const useCases = [
    { title: copy.useCaseFintech, body: copy.useCaseFintechBody, query: "category=markets&sort=score" },
    { title: copy.useCaseAgents, body: copy.useCaseAgentsBody, query: "limit=20&sort=score" },
    { title: copy.useCaseMedia, body: copy.useCaseMediaBody, query: "lang=ar&sort=score" },
    { title: copy.useCaseApps, body: copy.useCaseAppsBody, query: "from=2026-01-01&sort=date" },
  ];
  const [featured, ...rest] = useCases;

  const faqs = [
    { q: copy.faqWhatQ, a: copy.faqWhatA },
    { q: copy.faqWhereQ, a: copy.faqWhereA },
    { q: copy.faqLangQ, a: copy.faqLangA },
    { q: copy.faqImpactQ, a: copy.faqImpactA },
    { q: copy.faqArchiveQ, a: copy.faqArchiveA },
    { q: copy.faqKeyQ, a: copy.faqKeyA },
    { q: copy.faqPayQ, a: copy.faqPayA },
  ];

  return (
    <div lang={copy.lang} dir={copy.dir}>
      <section className="mkt-hero" aria-labelledby="mkt-hero-title">
        <div className="mkt-hero-mesh" aria-hidden="true" />
        <div className="mkt-hero-split">
          <div className="mkt-hero-copy">
            <p className="mkt-product-line">{copy.productLine}</p>
            <h1 id="mkt-hero-title">{copy.heroHeadline}</h1>
            <p className="mkt-hero-lede" data-aeo-answer>
              {copy.heroLede}
            </p>
            <div className="mkt-cta-row">
              <Link href={signupHref} className="mkt-btn mkt-btn-primary">
                {copy.ctaKey}
              </Link>
              <Link href={docsHref} className="mkt-btn mkt-btn-ghost">
                {copy.ctaExploreApi}
              </Link>
            </div>
            <p className="mkt-hero-proof">{copy.heroProof}</p>
          </div>

          <div className="mkt-hero-stage">
            <Image
              src="/marketing/cyan-bloom.webp"
              alt=""
              width={1536}
              height={1024}
              className="mkt-hero-bloom"
              priority
            />
            <pre className="mkt-hero-json" tabIndex={0} dir="ltr" lang="en">
              <code>
                <span className="mkt-demo-method">{copy.demoGet}</span> /v1/market-news
                {"\n"}
                {demoJson}
              </code>
            </pre>
            <article className="mkt-product-card" aria-label={copy.sampleVisualTitle}>
              <div className="mkt-product-card-top">
                <p>{copy.sampleCardKicker}</p>
                <p className="mkt-impact-pill">
                  {copy.sampleImpactLabel} {copy.sampleImpactValue}
                </p>
              </div>
              <h2>{copy.sampleCardTitle}</h2>
              <p className="mkt-product-meta">
                <span>{copy.sampleCardMeta}</span>
                <span>{copy.sampleCardSource}</span>
                <span>{copy.sampleCardDate}</span>
              </p>
            </article>
          </div>
        </div>
      </section>

      <MarketingReveal as="section" className="mkt-manifesto" aria-labelledby="mkt-manifesto-title">
        <div className="mkt-split-block">
          <div className="mkt-split-copy">
            <h2 id="mkt-manifesto-title">{copy.manifestoTitle}</h2>
            <p className="mkt-manifesto-lede">{copy.manifestoLede}</p>
            <p className="mkt-definition" data-aeo-answer>
              {copy.definitionAnswer}
            </p>
          </div>
          <figure className="mkt-split-visual mkt-manifesto-visual">
            <Image
              src="/marketing/brief-news-stream.png"
              alt={copy.manifestoVisualAlt}
              width={1536}
              height={1024}
              loading="lazy"
            />
          </figure>
        </div>
      </MarketingReveal>

      <section className="mkt-contrast" aria-labelledby="mkt-contrast-title">
        <h2 id="mkt-contrast-title" className="mkt-visually-hidden">
          {lang === "en" ? "How Briefly differs" : "كيف تختلف Briefly"}
        </h2>
        <div className="mkt-contrast-stage">
          <MarketingReveal
            as="article"
            className="mkt-contrast-panel mkt-contrast-panel--other"
            aria-label={`${copy.contrastOtherSubject} = ${copy.contrastOtherOutcome}`}
          >
            <p className="mkt-contrast-subject">{copy.contrastOtherSubject}</p>
            <p className="mkt-contrast-equation">
              <span className="mkt-contrast-equals" aria-hidden="true">
                =
              </span>
              <span className="mkt-contrast-outcome">{copy.contrastOtherOutcome}</span>
            </p>
          </MarketingReveal>

          <div className="mkt-contrast-vs" aria-hidden="true">
            <span>{lang === "en" ? "vs" : "مقابل"}</span>
          </div>

          <MarketingReveal
            as="article"
            className="mkt-contrast-panel mkt-contrast-panel--briefly"
            delayMs={80}
            aria-label={`${copy.contrastBrand} = ${copy.contrastBrieflyEm}${copy.contrastBrieflyAfter}`}
          >
            <p className="mkt-contrast-subject">{copy.contrastBrand}</p>
            <p className="mkt-contrast-equation">
              <span className="mkt-contrast-equals" aria-hidden="true">
                =
              </span>
              <span className="mkt-contrast-outcome">
                <span className="mkt-contrast-accent">{copy.contrastBrieflyEm}</span>
                {copy.contrastBrieflyAfter}
              </span>
            </p>
          </MarketingReveal>
        </div>
      </section>

      <section className="mkt-section mkt-signal">
        <div className="mkt-split-block">
          <div className="mkt-split-copy">
            <h2>{copy.provideTitle}</h2>
            <p>{copy.provideLede}</p>
            <ul className="mkt-signal-list">
              {signals.map((item) => (
                <li key={item.title}>
                  <span className="mkt-icon-well">{item.icon}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <figure className="mkt-split-visual">
            <Image src="/marketing/data-network.webp" alt="" width={1536} height={1024} />
          </figure>
        </div>
      </section>

      <section className="mkt-section mkt-intel" aria-labelledby="mkt-intel-title">
        <div className="mkt-section-head">
          <h2 id="mkt-intel-title">{copy.intelTitle}</h2>
          <p>{copy.intelLede}</p>
        </div>
        <ul className="mkt-intel-grid">
          {capabilities.map((item) => (
            <li key={item.n}>
              <span className="mkt-intel-index" aria-hidden="true">
                {item.n}
              </span>
              <span className="mkt-icon-well">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
        <aside className="mkt-roadmap" aria-labelledby="mkt-roadmap-title">
          <h3 id="mkt-roadmap-title">{copy.roadmapTitle}</h3>
          <p>{copy.roadmapLede}</p>
          <ul>
            {roadmapItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="mkt-section mkt-flow" aria-labelledby="mkt-flow-title">
        <div className="mkt-section-head">
          <h2 id="mkt-flow-title">{copy.flowTitle}</h2>
          <p>{copy.flowLede}</p>
        </div>
        <ol className="mkt-flow-steps">
          {flowSteps.map((item) => (
            <li key={item.n}>
              <span className="mkt-flow-index" aria-hidden="true">
                {item.n}
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
        <p className="mkt-flow-closer">{copy.flowCloser}</p>
      </section>

      <section id="coverage" className="mkt-section mkt-coverage">
        <div className="mkt-coverage-stage">
          <Image
            src="/marketing/dot-earth.webp"
            alt=""
            width={1536}
            height={1024}
            className="mkt-coverage-photo"
          />
          <div className="mkt-coverage-copy">
            <h2>{copy.scaleTitle}</h2>
            <p>{copy.coverageLede}</p>
            <ul className="mkt-coverage-stats">
              <li>
                <strong>{countryCount}+</strong>
                <span>{copy.scaleCountriesHint}</span>
              </li>
              <li>
                <strong>{copy.scaleCats}</strong>
                <span>{copy.scaleCatsHint}</span>
              </li>
              <li>
                <strong>{copy.scaleLangs}</strong>
                <span>{copy.scaleLangsHint}</span>
              </li>
            </ul>
            <Link href={briefingHref} className="mkt-btn mkt-btn-primary">
              {copy.coverageCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-regions-map" aria-labelledby="mkt-regions-title">
        <div className="mkt-regions-stage">
          <div className="mkt-regions-copy">
            <h2 id="mkt-regions-title">{copy.regionsMapTitle}</h2>
            <p>{copy.regionsMapLede}</p>
          </div>
          <div className="mkt-regions-board">
            <Image
              src="/marketing/dot-world.webp"
              alt=""
              width={1536}
              height={1024}
              className="mkt-regions-bg"
            />
            <ul className="mkt-region-pins">
            {regionPins.map((pin) => (
              <li key={pin.code}>
                <Link
                  href={briefingHref}
                  className={`mkt-region-card is-${pin.code}`}
                >
                  <h3>{lang === "en" ? pin.label : pin.labelAr}</h3>
                  <p className="mkt-region-codes" dir="ltr" lang="en">
                    {pin.samples.join(" · ")}
                  </p>
                  <p className="mkt-region-meta">
                    <strong>{pin.count}</strong>
                    <span>{copy.regionCountHint}</span>
                    {pin.more > 0 ? (
                      <span>
                        +{pin.more} {copy.regionMore}
                      </span>
                    ) : null}
                  </p>
                </Link>
              </li>
            ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mkt-impact-band" aria-labelledby="mkt-impact-title">
        <Image
          src="/marketing/earth-night.webp"
          alt=""
          width={1536}
          height={1024}
          className="mkt-impact-photo"
        />
        <div className="mkt-split-block mkt-split-block-flip">
          <div className="mkt-scoreboard" aria-label={copy.impactTitle}>
            <p className="mkt-scoreboard-kicker">{copy.sampleScoreTitle}</p>
            <p className="mkt-scoreboard-value">{copy.sampleImpactValue}</p>
            <p className="mkt-scoreboard-state">{copy.sampleImpactHigh}</p>
            <ScoreBars rows={scores} />
          </div>
          <div className="mkt-split-copy">
            <h2 id="mkt-impact-title">{copy.impactTitle}</h2>
            <p>{copy.impactLede}</p>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-audience" aria-labelledby="mkt-audience-title">
        <div className="mkt-audience-head">
          <h2 id="mkt-audience-title">{copy.useCasesTitle}</h2>
          <p>{copy.useCasesLede}</p>
        </div>
        <article className="mkt-audience-lead">
          <div>
            <h3>{featured.title}</h3>
            <p>{featured.body}</p>
            <p className="mkt-audience-query">
              <span>{copy.useCaseQuery}</span>
              <code dir="ltr" lang="en">
                {featured.query}
              </code>
            </p>
          </div>
          <Image
            src="/marketing/audience-desk.jpg"
            alt=""
            width={1536}
            height={1024}
          />
        </article>
        <ul className="mkt-audience-list">
          {rest.map((item) => (
            <li key={item.title}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
              <code dir="ltr" lang="en">
                {item.query}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section id="developers" className="mkt-section mkt-demo">
        <div className="mkt-split-block">
          <div className="mkt-split-copy">
            <h2>{copy.demoTitle}</h2>
            <p>{copy.demoLede}</p>
            <ul className="mkt-api-points">
              {[copy.apiPoint1, copy.apiPoint2, copy.apiPoint3].map((item) => (
                <li key={item}>
                  <Check {...icon} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mkt-cta-row">
              <Link href={docsHref} className="mkt-btn mkt-btn-primary">
                {copy.ctaDocs}
              </Link>
            </div>
          </div>
          <div className="mkt-demo-pane mkt-demo-json" dir="ltr" lang="en">
            <h3>{copy.demoGet}</h3>
            <p className="mkt-demo-url" dir="ltr" lang="en">
              <span className="mkt-demo-method">{copy.demoGet}</span>
              <code>{copy.apiPath}</code>
            </p>
            <pre className="mkt-code" tabIndex={0} dir="ltr" lang="en">
              <code>{demoSectionJson}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-bilingual">
        <div className="mkt-section-head">
          <h2>{copy.bilingualTitle}</h2>
          <p>{copy.bilingualLede}</p>
        </div>
        <div className="mkt-field-strip" dir="ltr" lang="en">
          <code>title</code>
          <code>summary</code>
          <code>arabic</code>
          <code>english</code>
        </div>
        <div className="mkt-bilingual-pair">
          <article>
            <span className="mkt-icon-well">
              <Translate {...icon} />
            </span>
            <h3>{copy.bilingualArTitle}</h3>
            <p>{copy.bilingualArBody}</p>
          </article>
          <article>
            <span className="mkt-icon-well">
              <Code {...icon} />
            </span>
            <h3>{copy.bilingualEnTitle}</h3>
            <p>{copy.bilingualEnBody}</p>
          </article>
        </div>
      </section>

      <section className="mkt-section mkt-trust">
        <div className="mkt-section-head">
          <h2>{copy.trustTitle}</h2>
          <p>{copy.trustLede}</p>
        </div>
        <div className="mkt-trust-grid">
          <article className="mkt-trust-tile">
            <div className="mkt-trust-visual" aria-hidden="true">
              <div className="mkt-trust-donut">
                <span>{countryCount}+</span>
              </div>
              <p className="mkt-trust-pill">{copy.trustPill}</p>
            </div>
            <p>{copy.trustCard1}</p>
          </article>

          <article className="mkt-trust-tile">
            <div className="mkt-trust-visual" aria-hidden="true">
              <div className="mkt-trust-query">
                <p className="mkt-trust-query-hint">{copy.trustTryTitle}</p>
              </div>
            </div>
            <p>{copy.trustCard2}</p>
          </article>
        </div>
      </section>

      <section id="pricing" className="mkt-section mkt-pricing">
        <div className="mkt-section-head">
          <h2>{copy.pricingTitle}</h2>
          <p>{copy.pricingLede}</p>
        </div>
        <PricingPlans lang={lang} variant="compact" />
      </section>

      <section className="mkt-section mkt-faq">
        <div className="mkt-section-head">
          <h2>{copy.faqTitle}</h2>
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

      <section className="mkt-final">
        <h2>{copy.finalTitle}</h2>
        <p>{copy.finalLede}</p>
        <div className="mkt-cta-row">
          <Link href={signupHref} className="mkt-btn mkt-btn-primary">
            {copy.ctaKey}
          </Link>
          <Link href={docsHref} className="mkt-btn mkt-btn-ghost">
            {copy.ctaDocs}
          </Link>
        </div>
      </section>
    </div>
  );
}
