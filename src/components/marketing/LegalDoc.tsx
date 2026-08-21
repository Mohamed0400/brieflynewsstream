import { legalCopy } from "@/lib/legal-copy";
import type { MarketingLang } from "@/lib/marketing-copy";

export function LegalDoc({
  lang,
  kind,
}: {
  lang: MarketingLang;
  kind: "privacy" | "terms";
}) {
  const copy = legalCopy(lang, kind);

  return (
    <article className="mkt-page mkt-legal-page">
      <div className="mkt-section">
        <div className="mkt-section-head">
          <h1>{copy.title}</h1>
          <p>{copy.lede}</p>
        </div>
        <p className="mkt-legal-updated">{copy.updated}</p>
        {copy.sections.map((section) => (
          <section key={section.title} className="mkt-legal-block">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
