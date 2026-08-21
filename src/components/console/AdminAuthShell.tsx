import type { ReactNode } from "react";
import { ConsoleAuthLangSync, ConsoleLangSwitcher } from "@/components/console/ConsoleLang";
import { BrandLogo } from "@/components/media/BrandLogo";
import { ADMIN_APP_PATH } from "@/lib/admin-app";
import type { ConsoleLoginCopy } from "@/lib/console-translation";

export function AdminAuthShell({
  copy,
  children,
}: {
  copy: ConsoleLoginCopy;
  children: ReactNode;
}) {
  return (
    <div className="ops-gate" lang={copy.lang} dir={copy.dir}>
      <ConsoleAuthLangSync lang={copy.lang} />
      <div className="ops-gate-frame">
        <div className="ops-gate-brand">
          <BrandLogo tone="dark" className="console-brand-wordmark" priority />
        </div>
        <p className="ops-gate-kicker">{copy.brandName}</p>
        <h1 id="ops-login-title">{copy.opsTitle}</h1>
        <p className="ops-gate-lede">{copy.opsLede}</p>
        {children}
        <div className="ops-gate-lang">
          <ConsoleLangSwitcher lang={copy.lang} login basePath={ADMIN_APP_PATH} />
        </div>
      </div>
    </div>
  );
}
