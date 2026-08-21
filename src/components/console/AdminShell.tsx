"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ConsoleDocumentLang, ConsoleLangSwitcher, useConsoleCopy } from "@/components/console/ConsoleLang";
import { BrandLogo } from "@/components/media/BrandLogo";
import { ADMIN_APP_PATH, ADMIN_OPERATIONS_PATH, ADMIN_SCHEDULE_PATH } from "@/lib/admin-app";
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
    { href: ADMIN_OPERATIONS_PATH, key: "opsHome" as const },
    { href: ADMIN_SCHEDULE_PATH, key: "schedule" as const },
  ];

  async function logOut() {
    await fetch("/api/console/session", { method: "DELETE" });
    router.push(lang === "en" ? `${ADMIN_APP_PATH}?lang=en` : ADMIN_APP_PATH);
    router.refresh();
  }

  return (
    <div className="console-shell console-shell-branded ops-shell" lang={copy.lang} dir={copy.dir}>
      <ConsoleDocumentLang lang={copy.lang} dir={copy.dir} />
      <header className="console-header">
        <div className="console-header-inner">
          <Link href={ADMIN_OPERATIONS_PATH} className="console-brand" aria-label={copy.opsBrandAria}>
            <BrandLogo tone="dark" className="console-brand-wordmark" priority />
          </Link>
          <div className="console-header-actions">
            <ConsoleLangSwitcher lang={lang} />
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
            <strong title={accountEmail}>{accountEmail}</strong>
            <span>{copy.opsBrand}</span>
          </div>
          <nav className="console-navigation" aria-label={copy.opsNavAria}>
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
                  {item.key === "schedule" ? copy.nav.schedule : copy.opsHome}
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
