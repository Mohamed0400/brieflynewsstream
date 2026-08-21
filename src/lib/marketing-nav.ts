import type { MarketingLang } from "@/lib/marketing-copy";

export function withMarketingLang(path: string, lang: MarketingLang) {
  const [pathname, hash] = path.split("#");
  if (lang !== "en") {
    return hash ? `${pathname}#${hash}` : pathname;
  }
  const href = `${pathname}${pathname.includes("?") ? "&" : "?"}lang=en`;
  return hash ? `${href}#${hash}` : href;
}

export function marketingLangHref(
  pathname: string,
  search: string,
  nextLang: MarketingLang,
) {
  const params = new URLSearchParams(search);
  if (nextLang === "en") params.set("lang", "en");
  else params.delete("lang");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function marketingPathActive(pathname: string, href: string) {
  const path = href.split("#")[0].split("?")[0] || "/";
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}
