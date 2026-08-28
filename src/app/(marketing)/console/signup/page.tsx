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
    title: isEn ? siteTitle("en", "Register") : siteTitle("ar", "التسجيل"),
    description: isEn
      ? "Register for a free Briefly NewsStream account with email and password. Then mint an API key for bilingual market news."
      : "سجّل حساباً مجانياً في Briefly NewsStream بالبريد وكلمة المرور. بعدها أصدر مفتاح API لأخبار الأسواق ثنائية اللغة.",
    path: "/console/signup",
    pathEn: "/console/signup?lang=en",
    keywords: [
      "news API sign up",
      "create news API account",
      "free news API key",
      "Briefly NewsStream register",
    ],
  });
}

export default async function ConsoleSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; error?: string }>;
}) {
  if (await hasConsoleSession()) redirect("/console/overview");

  const params = await searchParams;
  const lang = await getConsoleLoginLang(params.lang);
  const copy = consoleLoginCopy(lang);
  const initialError = params.error === "account_status" ? copy.accountUnavailable : "";
  const isEn = lang === "en";
  const description = isEn
    ? "Register for a free Briefly NewsStream account with email and password. Then mint an API key for bilingual market news."
    : "سجّل حساباً مجانياً في Briefly NewsStream بالبريد وكلمة المرور. بعدها أصدر مفتاح API لأخبار الأسواق ثنائية اللغة.";

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            lang,
            name: isEn ? "Register" : "التسجيل",
            description,
            path: isEn ? "/console/signup?lang=en" : "/console/signup",
            speakableCssSelectors: [
              "#console-signup-title",
              ".console-gate-copy > p",
            ],
          }),
          breadcrumbJsonLd([
            { name: isEn ? "Home" : "الرئيسية", path: isEn ? "/?lang=en" : "/" },
            {
              name: isEn ? "Register" : "التسجيل",
              path: isEn ? "/console/signup?lang=en" : "/console/signup",
            },
          ]),
        ]}
      />
      <ConsoleAuthShell
        copy={copy}
        variant="signup"
        titleId="console-signup-title"
        title={copy.signupPageTitle}
        lede={copy.signupPageLede}
      >
        <ConsoleLoginForm copy={copy} variant="signup" initialError={initialError} />
      </ConsoleAuthShell>
    </>
  );
}
