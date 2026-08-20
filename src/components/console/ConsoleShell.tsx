"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ConsoleDocumentLang, ConsoleLangSwitcher, useConsoleCopy } from "@/components/console/ConsoleLang";
import type { ConsoleLang } from "@/lib/console-translation";

const customerNav = [
  { href: "/console/overview", key: "overview" },
  { href: "/console/explorer", key: "explorer" },
  { href: "/console/keys", key: "keys" },
  { href: "/console/billing", key: "billing" },
  { href: "/console/docs", key: "docs" },
  { href: "/console/docs/api", key: "apiDocs" },
] as const;

const adminNav = [
  { href: "/console/schedule", key: "schedule" },
] as const;

export function ConsoleShell({
  children,
  environment,
  lang,
  accountEmail,
  accountPlan,
  accountRole,
}: {
  children: ReactNode;
  environment: string;
  lang: ConsoleLang;
  accountEmail: string;
  accountPlan: string;
  accountRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { copy } = useConsoleCopy();
  const isAdmin = accountRole === "SUPER_ADMIN";
  const navigation = isAdmin
    ? [...customerNav.slice(0, 2), ...adminNav, ...customerNav.slice(2)]
    : customerNav;

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
    <div className="console-shell" lang={copy.lang} dir={copy.dir}>
      <ConsoleDocumentLang lang={copy.lang} dir={copy.dir} />
      <header className="console-header">
        <div className="console-header-inner">
          <Link href="/console/overview" className="console-brand" aria-label={copy.brandAria}>
            <span className="console-brand-mark" aria-hidden="true">{copy.lang === "ar" ? "م" : "MN"}</span>
            <span>
              <strong>{copy.brandName}</strong>
              <small>{copy.brandMark}</small>
            </span>
          </Link>
          <div className="console-header-actions">
            <ConsoleLangSwitcher lang={lang} />
            <span className="console-environment">{environment}</span>
            <Link href={lang === "en" ? "/news?lang=en" : "/news"} className="console-header-link">
              {copy.newsFeed}
            </Link>
            <button type="button" onClick={logOut} className="console-header-link console-logout">
              {copy.logOut}
            </button>
          </div>
        </div>
      </header>

      <div className="console-frame">
        <aside className="console-sidebar">
          <div className="console-account-block">
            <p>{copy.workspace}</p>
            <strong title={accountEmail}>{accountEmail}</strong>
            <span>{planLabel}{isAdmin ? " · Admin" : ""}</span>
          </div>
          <nav className="console-navigation" aria-label={copy.navAria}>
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="console-nav-link"
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                >
                  {copy.nav[item.key]}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main id="console-main" className="console-main">
          {children}
        </main>
      </div>
    </div>
  );
}
