import type { MarketingLang } from "@/lib/marketing-copy";

export function marketingLangFromSearch(
  searchParams?: { lang?: string } | null,
): MarketingLang {
  return searchParams?.lang === "en" ? "en" : "ar";
}

export function marketingDir(lang: MarketingLang) {
  return lang === "en" ? "ltr" : "rtl";
}
