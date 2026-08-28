"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ConsoleDocumentLang, ConsoleLangSwitcher, useConsoleCopy } from "@/components/console/ConsoleLang";
import { OpsNavProgress } from "@/components/console/ops/OpsNavProgress";
import { BrandLogo } from "@/components/media/BrandLogo";
import {
  ADMIN_ACCOUNTS_PATH,
  ADMIN_ANALYTICS_PATH,
  ADMIN_AUDIT_PATH,
  ADMIN_APP_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_RECOVERY_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SETTINGS_PATH,
  adminNavHref,
  isOpsNavActive,
} from "@/lib/admin-app";
import type { ConsoleLang } from "@/lib/console-translation";

export function AdminShell({
  children,
  environment,
  lang,
  accountEmail,
}: {
  children: ReactNode;
  environment: string;
  lang: ConsoleLang;
  accountEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { copy } = useConsoleCopy();
  const navigation = [
    { href: ADMIN_OVERVIEW_PATH, key: "overview" as const },
    { href: ADMIN_ACCOUNTS_PATH, key: "accounts" as const },
    { href: ADMIN_SCHEDULE_PATH, key: "schedule" as const },
    { href: ADMIN_RECOVERY_PATH, key: "recovery" as const },
    { href: ADMIN_ANALYTICS_PATH, key: "analytics" as const },
    { href: ADMIN_AUDIT_PATH, key: "audit" as const },
    { href: ADMIN_SETTINGS_PATH, key: "settings" as const },
  ];

  async function logOut() {
    await fetch("/api/console/session", { method: "DELETE" });
    router.push(lang === "en" ? `${ADMIN_APP_PATH}?lang=en` : ADMIN_APP_PATH);
    router.refresh();
  }

  return (
    <div className="console-shell console-shell-branded ops-shell" lang={copy.lang} dir={copy.dir}>
      <ConsoleDocumentLang lang={copy.lang} dir={copy.dir} />
      <OpsNavProgress />
      <header className="console-header">
        <div className="console-header-inner">
          <Link href={adminNavHref(ADMIN_OVERVIEW_PATH, lang)} className="console-brand" aria-label={copy.opsBrandAria}>
            <BrandLogo tone="light" className="console-brand-wordmark" priority />
          </Link>
          <div className="console-header-actions">
            <ConsoleLangSwitcher lang={lang} login basePath={ADMIN_APP_PATH} />
            <span className="console-environment">{environment}</span>
            <button type="button" onClick={logOut} className="console-header-link console-logout">
              {copy.logOut}
            </button>
          </div>
        </div>
      </header>

      <div className="console-frame">
        <aside className="console-sidebar">
          <div className="console-account-block">
            <p>{copy.opsWorkspace}</p>
            <strong className="console-account-email" title={accountEmail} dir="ltr">
              {accountEmail}
            </strong>
            <span>{copy.opsBrand}</span>
          </div>
          <nav className="console-navigation" aria-label={copy.opsNavAria}>
            {navigation.map((item) => {
              const active = isOpsNavActive(pathname, item.href);
              const label = copy.opsNav[item.key];
              return (
                <Link
                  key={item.href}
                  href={adminNavHref(item.href, lang)}
                  className="console-nav-link"
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                >
                  {label}
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
