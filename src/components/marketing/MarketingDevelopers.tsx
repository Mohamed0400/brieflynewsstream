import Image from "next/image";
import Link from "next/link";
import { DocsTimeline } from "@/components/marketing/DocsTimeline";
import {
  DEVELOPERS_AUTH_HTTP,
  DEVELOPERS_BASE_URL,
  DEVELOPERS_CURL,
  DEVELOPERS_ENVELOPE,
  DEVELOPERS_ERROR_JSON,
  DEVELOPERS_ERRORS,
  DEVELOPERS_FILTER_EXAMPLE,
  DEVELOPERS_HERO_HTTP,
  DEVELOPERS_ITEM_JSON,
  DEVELOPERS_JS,
  DEVELOPERS_NEWS_EXAMPLE,
  DEVELOPERS_PARAMS,
  DEVELOPERS_PHP,
  DEVELOPERS_PYTHON,
  DEVELOPERS_QUERY_FIELDS,
  DEVELOPERS_ROUTES,
  developersCopy,
} from "@/lib/developers-copy";
import { marketingCopy, type MarketingLang } from "@/lib/marketing-copy";

export function MarketingDevelopers({ lang }: { lang: MarketingLang }) {
  const copy = developersCopy(lang);
  const nav = marketingCopy(lang);
  const withLang = (path: string) =>
    lang === "en" ? `${path}${path.includes("?") ? "&" : "?"}lang=en` : path;
  const signupHref = withLang("/console/signup");
  const consoleDocsHref = withLang("/console/docs/api");

  const toc = [
    { href: "#start", label: copy.tocStart },
    { href: "#auth", label: copy.tocAuth },
    { href: "#market-news", label: copy.tocNews },
    { href: "#filters", label: copy.tocFilters },
    { href: "#response", label: copy.tocResponse },
    { href: "#errors", label: copy.tocErrors },
    { href: "#limits", label: copy.tocLimits },
  ] as const;

  const steps = [
    { n: "01", title: copy.start1Title, body: copy.start1Body },
    { n: "02", title: copy.start2Title, body: copy.start2Body },
    { n: "03", title: copy.start3Title, body: copy.start3Body },
  ];

  const fields = [
    { title: copy.fieldTitle, body: copy.fieldTitleBody, code: "title, arabic, english" },
    { title: copy.fieldCategory, body: copy.fieldCategoryBody, code: "category" },
    { title: copy.fieldMarket, body: copy.fieldMarketBody, code: "country, region" },
    { title: copy.fieldImpact, body: copy.fieldImpactBody, code: "scores.final, scores.marketImpact" },
    { title: copy.fieldDate, body: copy.fieldDateBody, code: "publishedAt" },
  ];

  const faqs = [
    { q: copy.faqKeyQ, a: copy.faqKeyA },
    { q: copy.faqScoreQ, a: copy.faqScoreA },
    { q: copy.faqPageQ, a: copy.faqPageA },
    { q: copy.faqWindowQ, a: copy.faqWindowA },
  ];

  const sdks = [
    { id: "js", label: copy.sdkJs, code: DEVELOPERS_JS },
    { id: "curl", label: copy.sdkCurl, code: DEVELOPERS_CURL },
    { id: "py", label: copy.sdkPy, code: DEVELOPERS_PYTHON },
    { id: "php", label: copy.sdkPhp, code: DEVELOPERS_PHP },
  ];

  return (
    <div className="mkt-page mkt-docs-page" lang={nav.lang} dir={nav.dir}>
      <DocsTimeline label={copy.tocLabel} items={toc} />

      <div className="mkt-docs-body">
        <section className="mkt-docs-hero" aria-labelledby="mkt-docs-title">
          <Image
            src="/developers/api-docs-surface.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="mkt-docs-hero-surface"
          />
          <div className="mkt-docs-hero-inner">
            <p className="mkt-docs-kicker">{copy.crumb}</p>
            <h1 id="mkt-docs-title">{copy.heroTitle}</h1>
            <p className="mkt-docs-lede" data-aeo-answer>
              {copy.heroLede}
            </p>
            <div className="mkt-cta-row">
              <Link href={signupHref} className="mkt-btn mkt-btn-primary">
                {copy.ctaKey}
              </Link>
              <a href="#start" className="mkt-btn mkt-btn-ghost">
                {copy.ctaDocs}
              </a>
            </div>
            <dl className="mkt-docs-base">
              <dt>{copy.baseLabel}</dt>
              <dd dir="ltr" lang="en">
                {DEVELOPERS_BASE_URL}
              </dd>
            </dl>
            <pre
              className="mkt-docs-code mkt-docs-hero-http"
              tabIndex={0}
              dir="ltr"
              lang="en"
              aria-label={copy.curlLabel}
            >
              <code>{DEVELOPERS_HERO_HTTP}</code>
            </pre>
          </div>
        </section>

        <section id="start" className="mkt-docs-section" aria-labelledby="mkt-docs-start">
          <h2 id="mkt-docs-start">{copy.startTitle}</h2>
          <ol className="mkt-docs-steps">
            {steps.map((step) => (
              <li key={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mkt-docs-panes">
            <figure>
              <figcaption>{copy.curlLabel}</figcaption>
              <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
                <code>{DEVELOPERS_CURL}</code>
              </pre>
            </figure>
            <figure>
              <figcaption>{copy.jsonLabel}</figcaption>
              <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
                <code>{DEVELOPERS_ITEM_JSON}</code>
              </pre>
            </figure>
          </div>
        </section>

        <section id="auth" className="mkt-docs-section" aria-labelledby="mkt-docs-auth">
          <h2 id="mkt-docs-auth">{copy.authTitle}</h2>
          <p>{copy.authLede}</p>
          <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
            <code>{DEVELOPERS_AUTH_HTTP}</code>
          </pre>
          <p>{copy.authHint}</p>
        </section>

        <section id="market-news" className="mkt-docs-section" aria-labelledby="mkt-docs-news">
          <h2 id="mkt-docs-news">{copy.newsTitle}</h2>
          <p className="mkt-docs-path" dir="ltr" lang="en">
            {copy.newsPath}
          </p>
          <p>{copy.newsLede}</p>
          <h3>{copy.routesTitle}</h3>
          <div className="mkt-docs-table-wrap" tabIndex={0}>
            <table className="mkt-docs-table">
              <thead>
                <tr>
                  <th scope="col">{copy.routePath}</th>
                  <th scope="col">{copy.paramDesc}</th>
                </tr>
              </thead>
              <tbody>
                {DEVELOPERS_ROUTES.map((route) => (
                  <tr key={route.path}>
                    <th scope="row" dir="ltr" lang="en">
                      <code>{route.path}</code>
                    </th>
                    <td>{copy[route.descKey]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>{copy.paramsTitle}</h3>
          <div className="mkt-docs-table-wrap" tabIndex={0}>
            <table className="mkt-docs-table">
              <thead>
                <tr>
                  <th scope="col">{copy.paramName}</th>
                  <th scope="col">{copy.paramType}</th>
                  <th scope="col">{copy.paramDesc}</th>
                </tr>
              </thead>
              <tbody>
                {DEVELOPERS_PARAMS.map((param) => (
                  <tr key={param.name}>
                    <th scope="row" dir="ltr" lang="en">
                      <code>{param.name}</code>
                    </th>
                    <td dir="ltr" lang="en">
                      {param.type}
                    </td>
                    <td>{copy[param.descKey]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>{copy.exampleTitle}</h3>
          <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
            <code>{DEVELOPERS_NEWS_EXAMPLE}</code>
          </pre>
          <h3>{copy.modelTitle}</h3>
          <p>{copy.modelLede}</p>
          <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
            <code>{DEVELOPERS_ITEM_JSON}</code>
          </pre>
          <ul className="mkt-docs-fields">
            {fields.map((field) => (
              <li key={field.title}>
                <h3>{field.title}</h3>
                <code dir="ltr" lang="en">
                  {field.code}
                </code>
                <p>{field.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="filters" className="mkt-docs-section" aria-labelledby="mkt-docs-filters">
          <h2 id="mkt-docs-filters">{copy.filtersTitle}</h2>
          <div className="mkt-docs-chips" dir="ltr" lang="en">
            {DEVELOPERS_QUERY_FIELDS.map((field) => (
              <code key={field}>{field}</code>
            ))}
          </div>
          <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
            <code>{DEVELOPERS_FILTER_EXAMPLE}</code>
          </pre>
          <p className="mkt-docs-callout">{copy.filtersHint}</p>
        </section>

        <section id="response" className="mkt-docs-section" aria-labelledby="mkt-docs-response">
          <h2 id="mkt-docs-response">{copy.responseTitle}</h2>
          <p>{copy.responseLede}</p>
          <ul className="mkt-docs-facts">
            <li>{copy.responseJson}</li>
            <li>{copy.responseFields}</li>
            <li>{copy.responseLang}</li>
            <li>{copy.responsePage}</li>
            <li>{copy.responseQuota}</li>
          </ul>
          <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
            <code>{DEVELOPERS_ENVELOPE}</code>
          </pre>
        </section>

        <section id="errors" className="mkt-docs-section" aria-labelledby="mkt-docs-errors">
          <h2 id="mkt-docs-errors">{copy.errorsTitle}</h2>
          <p>{copy.errorsLede}</p>
          <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
            <code>{DEVELOPERS_ERROR_JSON}</code>
          </pre>
          <div className="mkt-docs-table-wrap" tabIndex={0}>
            <table className="mkt-docs-table">
              <thead>
                <tr>
                  <th scope="col">HTTP</th>
                  <th scope="col">error</th>
                  <th scope="col">{copy.paramDesc}</th>
                </tr>
              </thead>
              <tbody>
                {DEVELOPERS_ERRORS.map((item) => (
                  <tr key={item.code}>
                    <td dir="ltr" lang="en">
                      {item.status}
                    </td>
                    <th scope="row" dir="ltr" lang="en">
                      <code>{item.code}</code>
                    </th>
                    <td>{copy[item.descKey]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="limits" className="mkt-docs-section" aria-labelledby="mkt-docs-limits">
          <h2 id="mkt-docs-limits">{copy.limitsTitle}</h2>
          <p>{copy.limitsLede}</p>
          <p>{copy.limitsPage}</p>
          <p>{copy.limitsWindow}</p>
        </section>

        <section id="sdk" className="mkt-docs-section" aria-labelledby="mkt-docs-sdk">
          <h2 id="mkt-docs-sdk">{copy.sdkTitle}</h2>
          <div className="mkt-docs-sdk">
            {sdks.map((sdk, index) => (
              <div key={sdk.id} className="mkt-docs-sdk-pane">
                <input
                  id={`mkt-docs-sdk-${sdk.id}`}
                  type="radio"
                  name="mkt-docs-sdk"
                  defaultChecked={index === 0}
                />
                <label htmlFor={`mkt-docs-sdk-${sdk.id}`}>{sdk.label}</label>
                <pre className="mkt-docs-code" tabIndex={0} dir="ltr" lang="en">
                  <code>{sdk.code}</code>
                </pre>
              </div>
            ))}
          </div>
          <p className="mkt-docs-links">
            <Link href={consoleDocsHref}>{copy.consoleDocs}</Link>
          </p>
        </section>

        <section className="mkt-docs-section mkt-docs-faq" aria-labelledby="mkt-docs-faq">
          <h2 id="mkt-docs-faq">{copy.faqTitle}</h2>
          <div className="mkt-faq-list">
            {faqs.map((item) => (
              <details key={item.q} className="mkt-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
