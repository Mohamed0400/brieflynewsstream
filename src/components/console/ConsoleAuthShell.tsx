import type { ReactNode } from "react";
import Link from "next/link";
import { ConsoleAuthLangSync } from "@/components/console/ConsoleLang";
import { BrandLogo } from "@/components/media/BrandLogo";
import { withConsoleLang, type ConsoleLoginCopy } from "@/lib/console-translation";

export type ConsoleAuthVariant = "signin" | "signup" | "reset";

export function ConsoleAuthShell({
  copy,
  variant,
  titleId,
  title,
  lede,
  children,
}: {
  copy: ConsoleLoginCopy;
  variant: ConsoleAuthVariant;
  titleId: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  const showProof = variant !== "reset";
  const skipLabel = variant === "signup" ? copy.skipToSignup : copy.skipToForm;

  return (
    <>
      <ConsoleAuthLangSync lang={copy.lang} />
      <div className="console-gate" data-variant={variant} lang={copy.lang} dir={copy.dir}>
        <a className="console-gate-skip" href="#console-auth-form">
          {skipLabel}
        </a>

        <section className="console-gate-stage" aria-labelledby={titleId}>
          <div id="console-auth-form" className="console-gate-copy">
            <h1 id={titleId}>{title}</h1>
            {lede ? <p>{lede}</p> : null}
            {children}
            <Link href={withConsoleLang("/", copy.lang)} className="console-gate-home">
              {copy.backHome}
            </Link>
          </div>
        </section>

        {showProof ? <ConsoleAuthProof copy={copy} variant={variant} /> : null}
      </div>
    </>
  );
}

function ConsoleAuthProof({
  copy,
  variant,
}: {
  copy: ConsoleLoginCopy;
  variant: Exclude<ConsoleAuthVariant, "reset">;
}) {
  return (
    <aside
      className="console-gate-proof"
      aria-label={variant === "signup" ? copy.signupProofTitle : copy.signinProofTitle}
    >
      <div className="console-gate-proof-mark" aria-hidden="true">
        <BrandLogo variant="mark" className="console-gate-mark-image" />
      </div>

      {variant === "signup" ? (
        <>
          <p className="console-gate-proof-title">{copy.signupProofTitle}</p>
          <p className="console-gate-proof-lede">{copy.signupProofLede}</p>
          <div className="console-gate-benefit-groups">
            <section>
              <p className="console-gate-group-label">{copy.signupGroupConsole}</p>
              <ul>
                <li>{copy.signupBenefit1}</li>
                <li>{copy.signupBenefit2}</li>
              </ul>
            </section>
            <section>
              <p className="console-gate-group-label">{copy.signupGroupFeed}</p>
              <ul>
                <li>{copy.signupBenefit3}</li>
                <li>{copy.signupBenefit4}</li>
                <li>{copy.signupBenefit5}</li>
              </ul>
            </section>
          </div>
          <p className="console-gate-proof-foot">{copy.signupFoot}</p>
        </>
      ) : (
        <>
          <p className="console-gate-proof-title">{copy.signinProofTitle}</p>
          <p className="console-gate-proof-lede">{copy.signinProofLede}</p>
          <dl className="console-gate-facts">
            <div>
              <dt>{copy.signinFact1Title}</dt>
              <dd>{copy.signinFact1Body}</dd>
            </div>
            <div>
              <dt>{copy.signinFact2Title}</dt>
              <dd>{copy.signinFact2Body}</dd>
            </div>
            <div>
              <dt>{copy.signinFact3Title}</dt>
              <dd>{copy.signinFact3Body}</dd>
            </div>
          </dl>
        </>
      )}
    </aside>
  );
}
