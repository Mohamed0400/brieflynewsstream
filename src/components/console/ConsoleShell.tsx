"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookOpenText,
  CheckCircle,
  Code,
  CreditCard,
  GearSix,
  House,
  Key,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { ConsoleDocumentLang, ConsoleLangSwitcher, useConsoleCopy } from "@/components/console/ConsoleLang";
import { ConsoleMaintenanceBanner } from "@/components/console/ConsoleMaintenanceBanner";
import { BrandLogo } from "@/components/media/BrandLogo";
import type { MaintenanceStatus } from "@/lib/maintenance";
import type { ConsoleLang } from "@/lib/console-translation";

const customerNav = [
  { href: "/console/overview", key: "overview", Icon: House },
  { href: "/console/explorer", key: "explorer", Icon: MagnifyingGlass },
  { href: "/console/keys", key: "keys", Icon: Key },
  { href: "/console/billing", key: "billing", Icon: CreditCard },
  { href: "/console/docs", key: "docs", Icon: BookOpenText },
  { href: "/console/docs/api", key: "apiDocs", Icon: Code },
  { href: "/console/settings", key: "settings", Icon: GearSix },
] as const;

export function ConsoleShell({
  children,
  lang,
  accountEmail,
  accountDisplayName,
  accountPlan,
  maintenance,
}: {
  children: ReactNode;
  lang: ConsoleLang;
  accountEmail: string;
  accountDisplayName: string;
  accountPlan: string;
  maintenance: MaintenanceStatus;
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
  const isPaid = accountPlan === "PRO" || accountPlan === "ENTERPRISE";

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
          <strong title={accountDisplayName}>{accountDisplayName}</strong>
          <span className="console-app-account-email" title={accountEmail}>
            {accountEmail}
          </span>
          <span className="console-session-live">
            <CheckCircle size={16} weight="fill" aria-hidden="true" />
            {copy.activeAccount}
          </span>
        </div>
        <nav className="console-app-links" aria-label={copy.navAria}>
          {customerNav.map((item) => {
            const active =
              item.key === "settings"
                ? pathname === "/console/settings"
                : item.key === "docs"
                  ? pathname === "/console/docs"
                  : item.key === "apiDocs"
                    ? pathname.startsWith("/console/docs/api")
                    : pathname === item.href ||
                      (item.href !== "/console/overview" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.key}
                href={item.href}
                className="console-app-link"
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
              >
                <item.Icon size={18} weight={active ? "fill" : "regular"} aria-hidden="true" />
                {copy.nav[item.key]}
              </Link>
            );
          })}
        </nav>
        <div className="console-app-plan-card">
          <p className="console-app-plan-kicker">{copy.currentPlan}</p>
          <p className="console-app-plan-name">
            {isPaid ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : null}
            {planLabel}
          </p>
          <Link href="/console/billing" className="console-app-manage-plan">
            {copy.managePlan}
          </Link>
        </div>
      </aside>

      <main id="console-main" className="console-app-main">
        <ConsoleMaintenanceBanner initial={maintenance} />
        {children}
      </main>
    </div>
  );
}
