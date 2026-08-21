"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookOpenText,
  Code,
  CreditCard,
  House,
  Key,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { ConsoleDocumentLang, ConsoleLangSwitcher, useConsoleCopy } from "@/components/console/ConsoleLang";
import { BrandLogo } from "@/components/media/BrandLogo";
import type { ConsoleLang } from "@/lib/console-translation";

const customerNav = [
  { href: "/console/overview", key: "overview", Icon: House },
  { href: "/console/explorer", key: "explorer", Icon: MagnifyingGlass },
  { href: "/console/keys", key: "keys", Icon: Key },
  { href: "/console/billing", key: "billing", Icon: CreditCard },
  { href: "/console/docs", key: "docs", Icon: BookOpenText },
  { href: "/console/docs/api", key: "apiDocs", Icon: Code },
] as const;

export function ConsoleShell({
  children,
  lang,
  accountEmail,
  accountPlan,
}: {
  children: ReactNode;
  lang: ConsoleLang;
  accountEmail: string;
  accountPlan: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { copy } = useConsoleCopy();

  async function logOut() {
    await fetch("/api/console/session", { method: "DELETE" });
    router.push(lang === "en" ? "/console/login?lang=en" : "/console/login");
    router.refresh();
  }

  const planLabel =
    accountPlan === "PRO" ? "Pro"
    : accountPlan === "ENTERPRISE" ? "Enterprise"
    : copy.workspacePlan;

  return (
    <div className="console-shell console-app" lang={copy.lang} dir={copy.dir}>
      <ConsoleDocumentLang lang={copy.lang} dir={copy.dir} />
      <a className="console-app-skip" href="#console-main">
        {copy.skipToMain}
      </a>

      <header className="console-app-bar">
        <Link href="/console/overview" className="console-app-brand" aria-label={copy.brandAria}>
          <BrandLogo className="console-app-wordmark" priority />
        </Link>
        <p className="console-app-account" title={accountEmail}>
          {accountEmail}
        </p>
        <div className="console-app-bar-actions">
          <ConsoleLangSwitcher lang={lang} />
          <button type="button" onClick={logOut} className="console-app-logout">
            {copy.logOut}
          </button>
        </div>
      </header>

      <aside className="console-app-nav">
        <div className="console-app-account-block">
          <p>{copy.workspace}</p>
          <strong title={accountEmail}>{accountEmail}</strong>
          <span>{planLabel}</span>
          <span className="console-session-live">{copy.sessionActive}</span>
        </div>
        <nav className="console-app-links" aria-label={copy.navAria}>
          {customerNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="console-app-link"
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
              >
                <item.Icon size={18} weight="regular" aria-hidden="true" />
                {copy.nav[item.key]}
              </Link>
            );
          })}
        </nav>
        <div className="console-app-extra">
          <Link href={lang === "en" ? "/news?lang=en" : "/news"}>
            {copy.newsFeed}
          </Link>
        </div>
      </aside>

      <main id="console-main" className="console-app-main">
        {children}
      </main>
    </div>
  );
}
