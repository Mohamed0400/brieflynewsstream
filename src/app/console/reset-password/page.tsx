import type { Metadata } from "next";
import Link from "next/link";
import { ConsoleDocumentLang, ConsoleLangSwitcher } from "@/components/console/ConsoleLang";
import { ConsoleResetPasswordForm } from "@/components/console/ConsoleResetPasswordForm";
import { getConsoleLoginLang } from "@/lib/console-lang";
import { consoleLoginCopy } from "@/lib/console-translation";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const lang = await getConsoleLoginLang((await searchParams).lang);
  const copy = consoleLoginCopy(lang);
  return {
    title: `${copy.resetTitle} | ${copy.brandName}`,
    robots: { index: false, follow: false },
  };
}

export default async function ConsoleResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  // Recovery sessions still count as authenticated; allow the form either way.
  const lang = await getConsoleLoginLang((await searchParams).lang);
  const copy = consoleLoginCopy(lang);

  return (
    <main className="console-gate" lang={copy.lang} dir={copy.dir}>
      <ConsoleDocumentLang lang={copy.lang} dir={copy.dir} />
      <section className="console-gate-panel" aria-labelledby="console-reset-title">
        <header className="console-gate-top">
          <Link href="/console/login" className="console-gate-brand">
            <span className="console-gate-mark" aria-hidden="true">{copy.mark}</span>
            <span>
              <strong>{copy.brandName}</strong>
              <small>{copy.brandMark}</small>
            </span>
          </Link>
          <ConsoleLangSwitcher lang={lang} login />
        </header>
        <div className="console-gate-copy">
          <h1 id="console-reset-title">{copy.resetTitle}</h1>
          <ConsoleResetPasswordForm copy={copy} />
          <Link
            href={lang === "en" ? "/console/login?lang=en" : "/console/login"}
            className="console-gate-home"
          >
            {copy.backToSignIn}
          </Link>
        </div>
      </section>
    </main>
  );
}
