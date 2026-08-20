import Link from "next/link";
import { marketingCopy, type MarketingLang } from "@/lib/marketing-copy";
import { CloudinaryImage } from "@/components/media/CloudinaryImage";

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
  const docsHref = withLang("/developers");
  const signupHref = withLang("/console/login");
  const pricingHref = withLang("/pricing");
  const developersHref = withLang("/developers");
  const coverageHref = withLang("/coverage");

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
    { q: copy.faqWhatQ, a: copy.faqWhatA },
    { q: copy.faqWhereQ, a: copy.faqWhereA },
    { q: copy.faqLangQ, a: copy.faqLangA },
    { q: copy.faqImpactQ, a: copy.faqImpactA },
    { q: copy.faqArchiveQ, a: copy.faqArchiveA },
    { q: copy.faqKeyQ, a: copy.faqKeyA },
    { q: copy.faqPayQ, a: copy.faqPayA },
  ];

  const navItems: {
    href: string;
    label: string;
    console?: boolean;
  }[] = [
    { href: "#product", label: copy.navProduct },
    { href: coverageHref, label: copy.navCoverage },
    { href: developersHref, label: copy.navDevelopers },
    { href: pricingHref, label: copy.navPricing },
    { href: newsHref, label: copy.navLive },
    { href: consoleHref, label: copy.navConsole, console: true },
  ];

  return (
    <div className="mkt" lang={copy.lang} dir={copy.dir}>
      <a className="mkt-skip" href="#mkt-main">
        {copy.skipToContent}
      </a>

      <header className="mkt-nav">
        <div className="mkt-nav-inner">
          <Link href={homeHref} className="mkt-brand" aria-label={copy.brand}>
            <CloudinaryImage
              media="logoMark"
              alt=""
              width={40}
              height={40}
              deliveryWidth={80}
              className="mkt-brand-mark"
              priority
            />
            <span className="mkt-brand-name">{copy.brand}</span>
          </Link>

          <nav className="mkt-nav-links" aria-label={copy.navAria}>
            {navItems.map((item) =>
              item.href.startsWith("#") ? (
                <a key={item.label} href={item.href} className={item.console ? "mkt-nav-console" : undefined}>
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={item.console ? "mkt-nav-console" : undefined}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="mkt-lang" role="group" aria-label={copy.langAria}>
            <Link href="/" hrefLang="ar" lang="ar" className={lang === "ar" ? "is-active" : ""}>
              العربية
            </Link>
            <Link href="/?lang=en" hrefLang="en" lang="en" className={lang === "en" ? "is-active" : ""}>
              English
            </Link>
          </div>

          <details className="mkt-nav-drawer">
            <summary className="mkt-nav-drawer-btn">{copy.menuOpen}</summary>
            <nav className="mkt-nav-drawer-panel" aria-label={copy.navAria}>
              {navItems.map((item) =>
                item.href.startsWith("#") ? (
                  <a key={`m-${item.label}`} href={item.href}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={`m-${item.label}`} href={item.href}>
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </details>
        </div>
      </header>

      <main id="mkt-main">
        <section className="mkt-hero mkt-hero-void" aria-labelledby="mkt-hero-title">
          <div className="mkt-hero-void-bg" aria-hidden="true">
            <div className="mkt-hero-grid" />
            <div className="mkt-hero-glow" />
            <div className="mkt-hero-stream">
              <div className="mkt-hero-stream-rail mkt-hero-stream-rail-a">
                <span>impactScore:86</span>
                <span lang="ar">أسعار الذهب</span>
                <span>GOLD · GLOBAL</span>
                <span lang="ar">قرارات الفائدة</span>
                <span>titleEn · titleAr</span>
                <span>AR + EN</span>
                <span>stream · live</span>
                <span lang="ar">أثر السوق</span>
                <span>impactScore:86</span>
                <span lang="ar">أسعار الذهب</span>
                <span>GOLD · GLOBAL</span>
                <span lang="ar">قرارات الفائدة</span>
                <span>titleEn · titleAr</span>
                <span>AR + EN</span>
              </div>
              <div className="mkt-hero-stream-rail mkt-hero-stream-rail-b">
                <span lang="ar">نفط · طاقة</span>
                <span>JSON / v1</span>
                <span>bilingual</span>
                <span lang="ar">ثنائي اللغة</span>
                <span>markets</span>
                <span lang="ar">أسواق</span>
                <span>permanent archive</span>
                <span lang="ar">أرشيف دائم</span>
                <span lang="ar">نفط · طاقة</span>
                <span>JSON / v1</span>
                <span>bilingual</span>
                <span lang="ar">ثنائي اللغة</span>
                <span>markets</span>
                <span lang="ar">أسواق</span>
              </div>
            </div>
          </div>

          <div className="mkt-hero-content">
            <p className="mkt-hero-brand">{copy.brand}</p>
            <p className="mkt-hero-langs">
              <span lang="ar">العربية</span>
              <span aria-hidden="true">·</span>
              <span lang="en">English</span>
              <span className="mkt-hero-langs-note">{copy.heroLangSupport}</span>
            </p>
            <h1 id="mkt-hero-title">
              <span className="mkt-hero-line">{copy.heroHeadline}</span>
            </h1>
            <p className="mkt-hero-lede" data-aeo-answer>
              {copy.heroLede}
            </p>

            <form className="mkt-hero-search" action="/news" method="get" role="search">
              <label className="mkt-hero-search-label" htmlFor="mkt-hero-q">
                {copy.heroSearchLabel}
              </label>
              <div className="mkt-hero-search-row">
                <input
                  id="mkt-hero-q"
                  name="q"
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder={copy.heroSearchPlaceholder}
                  className="mkt-hero-search-input"
                />
                {lang === "en" ? <input type="hidden" name="lang" value="en" /> : null}
                <button type="submit" className="mkt-btn mkt-btn-primary mkt-hero-search-btn">
                  {copy.heroSearchSubmit}
                </button>
              </div>
            </form>

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

        <section className="mkt-section mkt-concepts" aria-labelledby="mkt-concepts-title">
          <div className="mkt-section-head">
            <h2 id="mkt-concepts-title">{copy.conceptsTitle}</h2>
            <p>{copy.conceptsLede}</p>
          </div>
          <div className="mkt-concept-grid">
            <figure className="mkt-concept mkt-concept-wide">
              <CloudinaryImage
                media="conceptArFirstDesk"
                alt={copy.conceptDeskTitle}
                width={1248}
                height={832}
                deliveryWidth={1248}
                className="mkt-concept-img"
                sizes="(max-width: 900px) 100vw, 70vw"
              />
              <figcaption>
                <strong>{copy.conceptDeskTitle}</strong>
                <span>{copy.conceptDeskBody}</span>
              </figcaption>
            </figure>
            <figure className="mkt-concept">
              <CloudinaryImage
                media="conceptFloatingStream"
                alt={copy.conceptStreamTitle}
                width={1248}
                height={832}
                deliveryWidth={900}
                className="mkt-concept-img"
                sizes="(max-width: 900px) 100vw, 40vw"
              />
              <figcaption>
                <strong>{copy.conceptStreamTitle}</strong>
                <span>{copy.conceptStreamBody}</span>
              </figcaption>
            </figure>
            <figure className="mkt-concept">
              <CloudinaryImage
                media="conceptBentoCoverage"
                alt={copy.conceptBentoTitle}
                width={1536}
                height={1024}
                deliveryWidth={900}
                className="mkt-concept-img"
                sizes="(max-width: 900px) 100vw, 40vw"
              />
              <figcaption>
                <strong>{copy.conceptBentoTitle}</strong>
                <span>{copy.conceptBentoBody}</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="developers" className="mkt-section mkt-sample">
          <div className="mkt-section-head">
            <h2>{copy.sampleTitle}</h2>
            <p>{copy.sampleLede}</p>
          </div>
          <pre className="mkt-code" tabIndex={0} dir="ltr" lang="en">
            <code>{sampleJson}</code>
          </pre>
        </section>

        <section id="product" className="mkt-section mkt-pillars">
          <div className="mkt-section-head">
            <h2>{copy.pillarsTitle}</h2>
            <p>{copy.pillarsLede}</p>
          </div>
          <div className="mkt-pillar-grid">
            {pillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className={index === 0 ? "mkt-pillar mkt-pillar-featured" : "mkt-pillar"}
              >
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
          <div className="mkt-cta-row">
            <Link href={coverageHref} className="mkt-btn mkt-btn-primary">
              {copy.navCoverage}
            </Link>
            <Link href={newsHref} className="mkt-btn mkt-btn-ghost">
              {copy.navLive}
            </Link>
          </div>
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
                {copy.planCtaStart}
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
            <Link href={homeHref}>{lang === "en" ? "Home" : "الرئيسية"}</Link>
            <Link href={coverageHref}>{copy.navCoverage}</Link>
            <Link href={developersHref}>{copy.navDevelopers}</Link>
            <Link href={pricingHref}>{copy.navPricing}</Link>
            <Link href={docsHref}>{copy.footerDocs}</Link>
            <Link href={consoleHref}>{copy.footerConsole}</Link>
            <Link href={newsHref}>{copy.footerNews}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
