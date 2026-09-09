import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsoleAuthShell } from "@/components/console/ConsoleAuthShell";
import { ConsoleResetPasswordForm } from "@/components/console/ConsoleResetPasswordForm";
import { BrandLoader } from "@/components/media/BrandLoader";
import { authProvider } from "@/lib/auth-provider";
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
  const lang = await getConsoleLoginLang((await searchParams).lang);
  const copy = consoleLoginCopy(lang);
  const provider = authProvider();

  return (
    <ConsoleAuthShell
      copy={copy}
      variant="reset"
      titleId="console-reset-title"
      title={copy.resetTitle}
    >
      <Suspense
        fallback={(
          <div className="console-gate-form console-gate-confirm" role="status">
            <BrandLoader size="sm" label={copy.resetChecking} showLabel />
          </div>
        )}
      >
        <ConsoleResetPasswordForm copy={copy} authProvider={provider} />
      </Suspense>
    </ConsoleAuthShell>
  );
}
