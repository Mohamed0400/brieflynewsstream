import { ShieldCheck } from "@phosphor-icons/react/ssr";
import { landingCopy } from "@/lib/landing-translation";

export function BriefTrustFooter({ lang }: { lang: "ar" | "en" }) {
  const copy = landingCopy(lang);

  return (
    <footer className="mkt-brief-trust-footer" dir={copy.dir} lang={copy.lang}>
      <ShieldCheck size={22} weight="regular" aria-hidden="true" />
      <div>
        <p className="mkt-brief-trust-footer__title">{copy.trustFooterTitle}</p>
        <p className="mkt-brief-trust-footer__subtext">{copy.trustFooterSubtext}</p>
      </div>
    </footer>
  );
}
