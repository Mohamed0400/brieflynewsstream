import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConsoleAuthShell } from "@/components/console/ConsoleAuthShell";
import { ConsoleLoginForm } from "@/components/console/ConsoleLoginForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { hasConsoleSession } from "@/lib/console-auth";
import { getConsoleLoginLang } from "@/lib/console-lang";
import { consoleLoginCopy } from "@/lib/console-translation";
import {
  SITE_NAME,
  siteTitle,
  breadcrumbJsonLd,
  pageMetadata,
  webPageJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const lang = await getConsoleLoginLang((await searchParams).lang);
  const isEn = lang === "en";
  return pageMetadata({
    lang,
    title: isEn ? siteTitle("en", "Sign in") : siteTitle("ar", "تسجيل الدخول"),
    description: isEn
      ? "Sign in to the Briefly NewsStream developer console to manage API keys, explore bilingual market news, and access your workspace."
      : "سجّل الدخول إلى لوحة Briefly NewsStream لإدارة مفاتيح الواجهة واستكشاف أخبار الأسواق ثنائية اللغة ومساحة عملك.",
    path: "/console/login",
    pathEn: "/console/login?lang=en",
    keywords: [
      "news API console",
      "developer console sign in",
      "API key login",
      "Briefly NewsStream console",
    ],
  });
}

export default async function ConsoleLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; error?: string; forgot?: string }>;
}) {
  const params = await searchParams;
  const forgotMode = params.forgot === "1";
  if (!forgotMode && (await hasConsoleSession())) redirect("/console/overview");

  const lang = await getConsoleLoginLang(params.lang);
  const copy = consoleLoginCopy(lang);
  const initialError = params.error === "account_status" ? copy.accountUnavailable : "";
  const isEn = lang === "en";
  const description = isEn
    ? "Sign in to the Briefly NewsStream developer console to manage API keys, explore bilingual market news, and access your workspace."
    : "سجّل الدخول إلى لوحة Briefly NewsStream لإدارة مفاتيح الواجهة واستكشاف أخبار الأسواق ثنائية اللغة ومساحة عملك.";

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            lang,
            name: isEn ? "Sign in to the API Console" : "تسجيل الدخول إلى لوحة الواجهة",
            description,
            path: isEn ? "/console/login?lang=en" : "/console/login",
            speakableCssSelectors: [
              "#console-login-title",
              ".console-gate-copy > p",
            ],
          }),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: isEn ? "/?lang=en" : "/" },
            {
              name: isEn ? "Console sign in" : "تسجيل دخول اللوحة",
              path: isEn ? "/console/login?lang=en" : "/console/login",
            },
          ]),
        ]}
      />
      <ConsoleAuthShell
        copy={copy}
        variant="signin"
        titleId="console-login-title"
        title={copy.title}
        lede={copy.lede}
      >
        <ConsoleLoginForm
          copy={copy}
          variant="signin"
          initialError={initialError}
          initialMode={forgotMode ? "forgot" : undefined}
        />
      </ConsoleAuthShell>
    </>
  );
}
