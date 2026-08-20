import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConsoleDocumentLang, ConsoleLangSwitcher } from "@/components/console/ConsoleLang";
import { ConsoleLoginForm } from "@/components/console/ConsoleLoginForm";
import { isConsoleAuthenticated } from "@/lib/console-auth";
import { getConsoleLoginLang } from "@/lib/console-lang";
import { consoleLoginCopy } from "@/lib/console-translation";
import gateImage from "../../../../public/console-gate.png";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const lang = await getConsoleLoginLang((await searchParams).lang);
  const copy = consoleLoginCopy(lang);
  return {
    title: `${copy.title} | ${copy.brandName}`,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export default async function ConsoleLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  if (await isConsoleAuthenticated()) redirect("/console/overview");

  const lang = await getConsoleLoginLang((await searchParams).lang);
  const copy = consoleLoginCopy(lang);

  return (
    <main className="console-gate" lang={copy.lang} dir={copy.dir}>
      <ConsoleDocumentLang lang={copy.lang} dir={copy.dir} />
      <a className="console-gate-skip" href="#console-login-form">
        {copy.skipToForm}
      </a>

      <section className="console-gate-panel" aria-labelledby="console-login-title">
        <header className="console-gate-top">
          <Link href="/" className="console-gate-brand">
            <span className="console-gate-mark" aria-hidden="true">{copy.mark}</span>
            <span>
              <strong>{copy.brandName}</strong>
              <small>{copy.brandMark}</small>
            </span>
          </Link>
          <ConsoleLangSwitcher lang={lang} login />
        </header>

        <div id="console-login-form" className="console-gate-copy">
          <h1 id="console-login-title">{copy.title}</h1>
          <p>{copy.lede}</p>
          <ConsoleLoginForm copy={copy} />
          <Link href={lang === "en" ? "/?lang=en" : "/"} className="console-gate-home">
            {copy.backHome}
          </Link>
        </div>
      </section>

      <aside className="console-gate-visual" aria-hidden="true">
        <Image
          src={gateImage}
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="console-gate-image"
        />
        <div className="console-gate-scrim" />
        <div className="console-gate-wash" />
        <div className="console-gate-visual-copy">
          <p className="console-gate-visual-title">{copy.visualTitle}</p>
          <p>{copy.visualLede}</p>
        </div>
      </aside>
    </main>
  );
}
