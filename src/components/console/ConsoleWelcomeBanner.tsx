"use client";

import Link from "next/link";
import { DownloadSimple } from "@phosphor-icons/react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { BrandLogo } from "@/components/media/BrandLogo";

export function ConsoleWelcomeBanner({
  email,
  planLabel,
}: {
  email: string;
  planLabel: string;
}) {
  const { copy } = useConsoleCopy();

  return (
    <section className="console-welcome" aria-labelledby="console-welcome-title">
      <div className="console-welcome-copy">
        <h1 id="console-welcome-title">{copy.overview.heading}</h1>
        <p className="console-page-description">{copy.overview.description}</p>
        <p className="console-muted">
          {planLabel}
          {" · "}
          {email}
        </p>
        <div className="console-inline-actions">
          <a
            href="/api/console/platform-overview"
            className="console-primary-button"
            download="briefly-newsstream-platform.pdf"
          >
            <DownloadSimple size={18} weight="bold" aria-hidden="true" />
            {copy.overview.downloadPdf}
          </a>
          <Link href="/console/keys" className="console-secondary-button">
            {copy.nav.keys}
          </Link>
        </div>
        <p className="console-help">{copy.overview.downloadPdfHint}</p>
      </div>
      <div className="console-welcome-visual console-welcome-brand" aria-hidden="true">
        <BrandLogo variant="mark" className="console-welcome-mark" priority />
      </div>
    </section>
  );
}
