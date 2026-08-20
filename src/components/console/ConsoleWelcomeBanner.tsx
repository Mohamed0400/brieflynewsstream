"use client";

import Link from "next/link";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { CloudinaryImage } from "@/components/media/CloudinaryImage";

export function ConsoleWelcomeBanner({
  email,
  planLabel,
}: {
  email: string;
  planLabel: string;
}) {
  const { copy, lang } = useConsoleCopy();
  const isAr = lang === "ar";

  return (
    <section className="console-welcome" aria-labelledby="console-welcome-title">
      <div className="console-welcome-copy">
        <p className="console-kicker">{copy.overview.kicker}</p>
        <h1 id="console-welcome-title">{copy.overview.heading}</h1>
        <p className="console-page-description">{copy.overview.description}</p>
        <div className="console-welcome-badges" aria-label={isAr ? "حالة المساحة" : "Workspace status"}>
          <span className="console-welcome-badge">
            <strong>{isAr ? "ثنائي اللغة" : "AR + EN"}</strong>
          </span>
          <span className="console-welcome-badge console-welcome-badge-cyan">
            <strong>{isAr ? "أثر السوق" : "Impact"}</strong>
            <em>{isAr ? "نشط" : "ACTIVE"}</em>
          </span>
          <span className="console-welcome-badge">
            <strong>{planLabel}</strong>
            <em>{email}</em>
          </span>
        </div>
        <div className="console-inline-actions">
          <Link href="/console/explorer" className="console-primary-button">
            {copy.nav.explorer}
          </Link>
          <Link href="/console/keys" className="console-secondary-button">
            {copy.nav.keys}
          </Link>
        </div>
      </div>
      <div className="console-welcome-visual" aria-hidden="true">
        <CloudinaryImage
          media="conceptFloatingStream"
          alt=""
          fill
          priority
          deliveryWidth={960}
          sizes="(max-width: 960px) 100vw, 42vw"
          className="console-welcome-image"
        />
        <div className="console-welcome-float console-welcome-float-a">
          {isAr ? "البث مباشر" : "Live stream"}
        </div>
        <div className="console-welcome-float console-welcome-float-b">ع / EN</div>
      </div>
    </section>
  );
}
