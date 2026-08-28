"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { BrandLogo } from "@/components/media/BrandLogo";

export function ConsoleWelcomeBanner({
  planLabel,
  isPaid,
}: {
  planLabel: string;
  isPaid: boolean;
}) {
  const { copy } = useConsoleCopy();

  return (
    <section className="console-welcome console-welcome-pro" aria-labelledby="console-welcome-title">
      <div className="console-welcome-copy">
        <div className="console-welcome-brand-row">
          <BrandLogo variant="mark" className="console-welcome-mark-inline" priority />
          <div>
            <h1 id="console-welcome-title">{copy.overview.heading}</h1>
            <p className="console-page-description">{copy.overview.description}</p>
          </div>
        </div>
      </div>
      <aside className="console-welcome-plan-card" aria-label={copy.overview.planAria}>
        <p className="console-welcome-plan-label">{copy.overview.accountTypeLabel}</p>
        <p className="console-welcome-plan-name">{planLabel}</p>
        {isPaid ? (
          <p className="console-welcome-plan-status">
            <CheckCircle size={18} weight="fill" aria-hidden="true" />
            {copy.overview.activePaidAccount}
          </p>
        ) : (
          <p className="console-welcome-plan-status console-welcome-plan-status-free">
            {copy.workspacePlan}
          </p>
        )}
      </aside>
    </section>
  );
}
