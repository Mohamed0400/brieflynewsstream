import Image from "next/image";
import Link from "next/link";
import { marketingCopy, type MarketingLang } from "@/lib/marketing-copy";

const sampleJson = `{
  "articles": [{
    "id": "art_01",
    "titleAr": "أسعار الذهب ترتفع مع ترقّب قرارات الفائدة",
    "titleEn": "Gold prices climb ahead of rate decisions",
    "summaryAr": "المستثمرون يتابعون إشارات البنوك المركزية.",
    "summaryEn": "Investors watch central-bank signals.",
    "country": "GLOBAL",
    "category": "GOLD",
    "impactScore": 86,
    "publishedAt": "2026-08-20T08:12:00Z"
  }]
}`;

export function MarketingLanding({
  lang,
  articlesIndexed,
  countriesCovered,
}: {
  lang: MarketingLang;
  articlesIndexed: number;
  countriesCovered: number;
}) {
  const copy = marketingCopy(lang);
  const withLang = (path: string) => (lang === "en" ? `${path}${path.includes("?") ? "&" : "?"}lang=en` : path);
  const homeHref = lang === "en" ? "/?lang=en" : "/";
  const newsHref = withLang("/news");
  const consoleHref = withLang("/console");
  const docsHref = withLang("/console/docs/api");
  const signupHref = withLang("/console/login");

  const pillars = [
    { title: copy.pillarBilingualTitle, body: copy.pillarBilingualBody },
    { title: copy.pillarImpactTitle, body: copy.pillarImpactBody },
    { title: copy.pillarBriefingsTitle, body: copy.pillarBriefingsBody },
    { title: copy.pillarCoverageTitle, body: copy.pillarCoverageBody },
    { title: copy.pillarConsoleTitle, body: copy.pillarConsoleBody },
    { title: copy.pillarArchiveTitle, body: copy.pillarArchiveBody },
  ];

  const useCases = [
    { title: copy.useCaseFintech, body: copy.useCaseFintechBody },
    { title: copy.useCaseMedia, body: copy.useCaseMediaBody },
    { title: copy.useCaseAgents, body: copy.useCaseAgentsBody },
    { title: copy.useCaseApps, body: copy.useCaseAppsBody },
  ];

  const faqs = [
    { q: copy.faqLangQ, a: copy.faqLangA },
    { q: copy.faqImpactQ, a: copy.faqImpactA },
    { q: copy.faqArchiveQ, a: copy.faqArchiveA },
    { q: copy.faqPayQ, a: copy.faqPayA },
  ];

  return (
    <div className="mkt" lang={copy.lang} dir={copy.dir}>
      <a className="mkt-skip" href="#mkt-main">
        Skip to content
      </a>

      <header className="mkt-nav">
        <div className="mkt-nav-inner">
          <Link href={homeHref} className="mkt-brand" aria-label={copy.brand}>
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={40}
              height={40}
              className="mkt-brand-mark"
              priority
            />
            <span className="mkt-brand-name">{copy.brand}</span>
          </Link>
          <nav className="mkt-nav-links" aria-label="Primary">
            <a href="#product">{copy.navProduct}</a>
            <a href="#coverage">{copy.navCoverage}</a>
            <a href="#developers">{copy.navDevelopers}</a>
            <a href="#pricing">{copy.navPricing}</a>
            <Link href={newsHref}>{copy.navLive}</Link>
            <Link href={consoleHref} className="mkt-nav-console">
              {copy.navConsole}
            </Link>
          </nav>
          <div className="mkt-lang" role="group" aria-label="Language">
            <Link href="/" hrefLang="ar" lang="ar" className={lang === "ar" ? "is-active" : ""}>
              العربية
            </Link>
            <Link href="/?lang=en" hrefLang="en" lang="en" className={lang === "en" ? "is-active" : ""}>
              English
            </Link>
          </div>
        </div>
      </header>

      <main id="mkt-main">
        <section className="mkt-hero" aria-labelledby="mkt-hero-title">
          <div className="mkt-hero-media" aria-hidden="true">
            <Image
              src="/hero-markets.png"
              alt=""
              fill
              priority
              className="mkt-hero-image"
              sizes="100vw"
            />
            <div className="mkt-hero-scrim" />
          </div>
          <div className="mkt-hero-content">
            <p className="mkt-hero-brand">{copy.brand}</p>
            <h1 id="mkt-hero-title">{copy.heroHeadline}</h1>
            <p className="mkt-hero-lede">{copy.heroLede}</p>
            <div className="mkt-cta-row">
              <Link href={signupHref} className="mkt-btn mkt-btn-primary">
                {copy.ctaKey}
              </Link>
              <Link href={docsHref} className="mkt-btn mkt-btn-ghost">
                {copy.ctaDocs}
              </Link>
            </div>
          </div>
        </section>

        <section className="mkt-proof" aria-label={copy.proofLine}>
          <p>{copy.proofLine}</p>
          <ul>
            <li>{copy.proofCountries}</li>
            <li>{copy.proofLangs}</li>
            <li>{copy.proofImpact}</li>
            <li>{copy.proofArchive}</li>
          </ul>
        </section>

        <section id="developers" className="mkt-section mkt-sample">
          <div className="mkt-section-head">
            <h2>{copy.sampleTitle}</h2>
            <p>{copy.sampleLede}</p>
          </div>
          <pre className="mkt-code" tabIndex={0}>
            <code>{sampleJson}</code>
          </pre>
        </section>

        <section id="product" className="mkt-section mkt-pillars">
          <div className="mkt-section-head">
            <h2>{copy.pillarsTitle}</h2>
            <p>{copy.pillarsLede}</p>
          </div>
          <div className="mkt-pillar-grid">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="mkt-pillar">
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="coverage" className="mkt-section mkt-coverage">
          <div className="mkt-section-head">
            <h2>{copy.coverageTitle}</h2>
            <p>{copy.coverageLede}</p>
          </div>
          <Link href={newsHref} className="mkt-btn mkt-btn-primary">
            {copy.navLive}
          </Link>
        </section>

        <section className="mkt-section mkt-usecases">
          <div className="mkt-section-head">
            <h2>{copy.useCasesTitle}</h2>
          </div>
          <div className="mkt-use-grid">
            {useCases.map((item) => (
              <article key={item.title} className="mkt-use">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mkt-section mkt-trust">
          <div className="mkt-section-head">
            <h2>{copy.trustTitle}</h2>
            <p>{copy.trustLede}</p>
          </div>
          <dl className="mkt-metrics">
            <div>
              <dt>{copy.metricArticles}</dt>
              <dd>{articlesIndexed.toLocaleString(lang === "ar" ? "ar" : "en")}</dd>
            </div>
            <div>
              <dt>{copy.metricCountries}</dt>
              <dd>{countriesCovered}</dd>
            </div>
            <div>
              <dt>{copy.metricLanguages}</dt>
              <dd>{copy.metricLanguagesValue}</dd>
            </div>
          </dl>
        </section>

        <section id="pricing" className="mkt-section mkt-pricing">
          <div className="mkt-section-head">
            <h2>{copy.pricingTitle}</h2>
            <p>{copy.pricingLede}</p>
          </div>
          <div className="mkt-price-grid">
            <article className="mkt-price">
              <h3>{copy.planFree}</h3>
              <p className="mkt-price-amount">{copy.planFreePrice}</p>
              <p>{copy.planFreeBody}</p>
              <Link href={signupHref} className="mkt-btn mkt-btn-ghost">
                {copy.planCtaStart}
              </Link>
            </article>
            <article className="mkt-price mkt-price-featured">
              <h3>{copy.planPro}</h3>
              <p className="mkt-price-amount">
                {copy.planProPrice}
                <span>{copy.planProPeriod}</span>
              </p>
              <p>{copy.planProBody}</p>
              <Link href={signupHref} className="mkt-btn mkt-btn-primary">
                {copy.planCtaContact}
              </Link>
            </article>
            <article className="mkt-price">
              <h3>{copy.planEnterprise}</h3>
              <p className="mkt-price-amount">{copy.planEnterprisePrice}</p>
              <p>{copy.planEnterpriseBody}</p>
              <Link href="mailto:hello@brieflynewsstream.com" className="mkt-btn mkt-btn-ghost">
                {copy.planCtaContact}
              </Link>
            </article>
          </div>
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
            <Link href={consoleHref} className="mkt-btn mkt-btn-ghost">
              {copy.navConsole}
            </Link>
          </div>
        </section>
      </main>

      <footer className="mkt-footer">
        <div className="mkt-footer-inner">
          <div>
            <strong>{copy.brand}</strong>
            <p>{copy.footerRights}</p>
          </div>
          <div>
            <p>{copy.footerProduct}</p>
            <Link href={docsHref}>{copy.footerDocs}</Link>
            <Link href={consoleHref}>{copy.footerConsole}</Link>
            <Link href={newsHref}>{copy.footerNews}</Link>
          </div>
          <div>
            <p>{copy.footerLegal}</p>
            <span>{copy.footerPrivacy}</span>
            <span>{copy.footerTerms}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
