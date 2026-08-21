import type { Metadata } from "next";
import { ConsoleAuthShell } from "@/components/console/ConsoleAuthShell";
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
  const lang = await getConsoleLoginLang((await searchParams).lang);
  const copy = consoleLoginCopy(lang);

  return (
    <ConsoleAuthShell
      copy={copy}
      variant="reset"
      titleId="console-reset-title"
      title={copy.resetTitle}
    >
      <ConsoleResetPasswordForm copy={copy} />
    </ConsoleAuthShell>
  );
}
