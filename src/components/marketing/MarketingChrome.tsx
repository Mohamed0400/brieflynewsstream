"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";
import {
  Code,
  House,
  List,
  MagnifyingGlass,
  Newspaper,
  RocketLaunch,
  Tag,
  User,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/media/BrandLogo";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { PageViewBeacon } from "@/components/analytics/PageViewBeacon";
import { marketingCopy, type MarketingLang } from "@/lib/marketing-copy";
import {
  marketingLangHref,
  marketingPathActive,
  withMarketingLang,
} from "@/lib/marketing-nav";
import type { PublicSiteSettings } from "@/lib/ops-settings";

function useMarketingLocation() {
  const routePath = usePathname() || "/";
  const searchParams = useSearchParams();
  const urlSearch = searchParams.toString();
  const urlLang: MarketingLang = searchParams.get("lang") === "en" ? "en" : "ar";

  const [pathname, setPathname] = useState(routePath);
  const [search, setSearch] = useState(urlSearch);
  const [lang, setLang] = useState<MarketingLang>(urlLang);
  const [pendingLang, setPendingLang] = useState<MarketingLang | null>(null);

  useEffect(() => {
    setPathname(routePath);
    setSearch(urlSearch);
    setLang(urlLang);
    setPendingLang(null);
  }, [routePath, urlSearch, urlLang]);

  const displayLang = pendingLang ?? lang;

  return {
    pathname,
    search,
    lang,
    displayLang,
    pendingLang,
    setLang,
    setSearch,
    setPendingLang,
  };
}

function useMarketingWaitCursor(pathname: string, search: string) {
  useEffect(() => {
    const root = document.querySelector(".mkt");
    if (root instanceof HTMLElement) root.removeAttribute("data-busy");
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== "_self") return;
      if (link.origin !== window.location.origin) return;
      if (link.hasAttribute("download")) return;
      if (link.pathname === window.location.pathname) return;
      const root = document.querySelector(".mkt");
      if (root instanceof HTMLElement) root.dataset.busy = "true";
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}

function MarketingNav({
  pathname,
  search,
  lang,
  displayLang,
  pendingLang,
  setLang,
  setSearch,
  setPendingLang,
}: ReturnType<typeof useMarketingLocation>) {
  const router = useRouter();
  const copy = marketingCopy(displayLang);
  const withLang = (path: string) => withMarketingLang(path, displayLang);
  const langHref = (nextLang: MarketingLang) => marketingLangHref(pathname, search, nextLang);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const loginHref = withLang("/console/login");
  const signupHref = withLang("/console/signup");

  useEffect(() => {
    setOpen(false);
  }, [pathname, displayLang]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const langPending = pendingLang !== null;

  const switchLang = (nextLang: MarketingLang) => {
    if (langPending || nextLang === lang) return;
    const href = langHref(nextLang);
    setPendingLang(nextLang);
    setLang(nextLang);
    setSearch(href.includes("?") ? href.split("?")[1] ?? "" : "");
    router.push(href, { scroll: false });
  };

  const navItems: Array<{ href: string; label: string; match: string }> = [
    { href: withLang("/"), label: copy.navHome, match: "/" },
    { href: withLang("/news"), label: copy.navLive, match: "/news" },
    { href: withLang("/developers"), label: copy.navDevelopers, match: "/developers" },
    { href: withLang("/pricing"), label: copy.navPricing, match: "/pricing" },
  ];

  const navIconFor = (match: string): Icon => {
    switch (match) {
      case "/news":
        return Newspaper;
      case "/developers":
        return Code;
      case "/pricing":
        return Tag;
      default:
        return House;
    }
  };

  return (
    <>
      <a className="mkt-skip" href="#mkt-main">
        {copy.skipToContent}
      </a>

      <header className="mkt-nav">
        <div className="mkt-nav-inner">
          <Link href={withLang("/")} className="mkt-brand" aria-label={copy.brand}>
            <BrandLogo className="mkt-brand-wordmark" priority />
          </Link>

          <nav className="mkt-nav-links" aria-label={copy.navAria}>
            {navItems.map((item) => {
              const active = marketingPathActive(pathname, item.match);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={active ? "is-active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <MarketingSearch id="mkt-nav-q" lang={displayLang} search={search} />

          <MarketingLangSwitcher
            lang={displayLang}
            pending={langPending}
            label={copy.langAria}
            arHref={langHref("ar")}
            enHref={langHref("en")}
            onSelect={switchLang}
          />

          <div className="mkt-nav-actions">
            <Link href={loginHref} className="mkt-btn mkt-btn-ghost">
              {copy.navLogin}
            </Link>
            <Link href={signupHref} className="mkt-btn mkt-btn-primary">
              {copy.ctaKey}
            </Link>
          </div>

          <div className="mkt-nav-drawer">
            <button
              type="button"
              className="mkt-nav-menu-trigger"
              aria-expanded={open}
              aria-controls="mkt-nav-menu"
              onClick={() => setOpen(true)}
            >
              <List className="mkt-nav-menu-trigger-icon" weight="bold" aria-hidden="true" />
              <span>{copy.menuOpen}</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mkt-nav-sheet${open ? " is-open" : ""}`}
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <button
          type="button"
          className="mkt-nav-scrim"
          aria-label={copy.menuClose}
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        />
        <aside
          id="mkt-nav-menu"
          className="mkt-nav-sheet-panel"
          aria-label={copy.navAria}
          role="dialog"
          aria-modal="true"
        >
          <div className="mkt-nav-sheet-head">
            <button
              ref={closeRef}
              type="button"
              className="mkt-nav-sheet-close"
              onClick={() => setOpen(false)}
            >
              <X weight="bold" aria-hidden="true" />
              <span>{copy.menuClose}</span>
            </button>
            <p className="mkt-nav-sheet-title">{copy.menuOpen}</p>
          </div>

          <div className="mkt-nav-sheet-toolbar">
            <MarketingLangSwitcher
              lang={displayLang}
              pending={langPending}
              label={copy.langAria}
              arHref={langHref("ar")}
              enHref={langHref("en")}
              onSelect={switchLang}
            />
          </div>

          <div className="mkt-nav-sheet-body">
            <MarketingSearch
              id="mkt-nav-q-menu"
              lang={displayLang}
              search={search}
              onSubmit={() => setOpen(false)}
            />

            <nav className="mkt-nav-sheet-links" aria-label={copy.navAria}>
              {navItems.map((item) => {
                const active = marketingPathActive(pathname, item.match);
                const Icon = navIconFor(item.match);
                return (
                  <Link
                    key={`m-${item.label}`}
                    href={item.href}
                    className={`mkt-nav-sheet-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="mkt-nav-sheet-link-label">{item.label}</span>
                    <Icon className="mkt-nav-sheet-link-icon" weight="regular" aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mkt-nav-sheet-foot">
            <Link
              href={loginHref}
              className="mkt-nav-sheet-login"
              onClick={() => setOpen(false)}
            >
              <span>{copy.navLogin}</span>
              <User className="mkt-nav-sheet-link-icon" weight="regular" aria-hidden="true" />
            </Link>
            <Link
              href={signupHref}
              className="mkt-btn mkt-btn-primary mkt-nav-sheet-cta"
              onClick={() => setOpen(false)}
            >
              <RocketLaunch weight="bold" aria-hidden="true" />
              <span>{copy.ctaKey}</span>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

function MarketingSearch({
  id,
  lang,
  search,
  onSubmit,
}: {
  id: string;
  lang: MarketingLang;
  search: string;
  onSubmit?: () => void;
}) {
  const copy = marketingCopy(lang);
  const router = useRouter();
  const pathname = usePathname() || "/";
  const query = new URLSearchParams(search).get("q") ?? "";
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query);
  }, [query]);

  function clearSearch() {
    setValue("");
    if (pathname !== "/news" || !query) return;
    const next = new URLSearchParams(search);
    next.delete("q");
    const qs = next.toString();
    router.push(qs ? `/news?${qs}` : "/news");
  }

  return (
    <form
      className="mkt-nav-search"
      action="/news"
      method="get"
      role="search"
      onSubmit={onSubmit}
    >
      {lang === "en" ? <input type="hidden" name="lang" value="en" /> : null}
      <label className="mkt-sr" htmlFor={id}>
        {copy.heroSearchLabel}
      </label>
      <div className="mkt-nav-search-field">
        <input
          id={id}
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={copy.heroSearchPlaceholder}
          maxLength={200}
          autoComplete="off"
          enterKeyHint="search"
        />
        {value ? (
          <button
            type="button"
            className="mkt-nav-search-clear"
            aria-label={copy.heroSearchClear}
            onClick={clearSearch}
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <button type="submit" className="mkt-nav-search-submit" aria-label={copy.heroSearchSubmit}>
        <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
      </button>
    </form>
  );
}

function MarketingLangSwitcher({
  lang,
  pending = false,
  label,
  arHref,
  enHref,
  onSelect,
}: {
  lang: MarketingLang;
  pending?: boolean;
  label: string;
  arHref: string;
  enHref: string;
  onSelect: (next: MarketingLang) => void;
}) {
  return (
    <div
      className={`mkt-lang${pending ? " is-pending" : ""}`}
      role="group"
      aria-label={label}
      aria-busy={pending || undefined}
      data-lang={lang}
    >
      <span className="mkt-lang-thumb" aria-hidden="true" />
      <Link
        href={arHref}
        hrefLang="ar"
        lang="ar"
        className={lang === "ar" ? "is-active" : undefined}
        aria-current={lang === "ar" ? "true" : undefined}
        aria-disabled={pending || undefined}
        scroll={false}
        onClick={(event) => {
          event.preventDefault();
          onSelect("ar");
        }}
      >
        العربية
      </Link>
      <Link
        href={enHref}
        hrefLang="en"
        lang="en"
        className={lang === "en" ? "is-active" : undefined}
        aria-current={lang === "en" ? "true" : undefined}
        aria-disabled={pending || undefined}
        scroll={false}
        onClick={(event) => {
          event.preventDefault();
          onSelect("en");
        }}
      >
        English
      </Link>
    </div>
  );
}

function MarketingFooter({ lang }: { lang: MarketingLang }) {
  const copy = marketingCopy(lang);
  const withLang = (path: string) => withMarketingLang(path, lang);

  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div className="mkt-footer-brand-col">
          <Link href={withLang("/")} className="mkt-footer-brand" aria-label={copy.brand}>
            <BrandLogo tone="dark" className="mkt-footer-wordmark" />
          </Link>
          <p>{copy.footerRights}</p>
          <Link href={withLang("/console/signup")} className="mkt-btn mkt-btn-primary">
            {copy.ctaKey}
          </Link>
        </div>
        <div className="mkt-footer-links">
          <nav aria-label={copy.footerProduct}>
            <h2>{copy.footerProduct}</h2>
            <Link href={withLang("/")}>{copy.footerHome}</Link>
            <Link href={withLang("/news")}>{copy.footerNews}</Link>
            <Link href={withLang("/pricing")}>{copy.navPricing}</Link>
          </nav>
          <nav aria-label={copy.footerResources}>
            <h2>{copy.footerResources}</h2>
            <Link href={withLang("/developers")}>{copy.footerDocs}</Link>
            <a href="/llms.txt">{copy.footerLlms}</a>
            <Link href={withLang("/console/login")}>{copy.footerConsole}</Link>
          </nav>
          <nav aria-label={copy.footerCompany}>
            <h2>{copy.footerCompany}</h2>
            <Link href={withLang("/developers")}>{copy.footerDevelopers}</Link>
            <Link href={withLang("/console/login")}>{copy.navLogin}</Link>
            <a href="mailto:hello@brieflynewsstream.com">{copy.footerContact}</a>
          </nav>
          <nav aria-label={copy.footerLegal}>
            <h2>{copy.footerLegal}</h2>
            <Link href={withLang("/privacy")}>{copy.footerPrivacy}</Link>
            <Link href={withLang("/terms")}>{copy.footerTerms}</Link>
          </nav>
        </div>
      </div>
      <div className="mkt-footer-meta">
        <p>{copy.footerCopyright}</p>
        <nav aria-label={copy.footerMetaAria}>
          <Link href={withLang("/privacy")}>{copy.footerPrivacy}</Link>
          <Link href={withLang("/terms")}>{copy.footerTerms}</Link>
          <a href="mailto:hello@brieflynewsstream.com">{copy.footerContact}</a>
          <Link href={withLang("/console/login")}>{copy.navLogin}</Link>
        </nav>
      </div>
    </footer>
  );
}

export function MarketingShell({
  children,
  siteSettings,
}: {
  children: ReactNode;
  siteSettings?: PublicSiteSettings;
}) {
  const location = useMarketingLocation();
  const displayLang = location.displayLang;
  const copy = marketingCopy(displayLang);
  useMarketingWaitCursor(location.pathname, location.search);
  const tracking = siteSettings?.pageViewTracking ?? true;
  const attribution = siteSettings?.attributionCapture ?? true;
  const maintenanceBanner = siteSettings?.maintenanceBanner?.trim() || "";

  return (
    <div className="mkt" lang={displayLang} dir={copy.dir}>
      {maintenanceBanner ? (
        <div className="mkt-maintenance-banner" role="status">
          {maintenanceBanner}
        </div>
      ) : null}
      <AttributionCapture enabled={attribution} />
      <PageViewBeacon locale={displayLang} enabled={tracking} />
      <MarketingNav {...location} />
      {children}
      <MarketingFooter lang={displayLang} />
    </div>
  );
}

export function MarketingNotFound() {
  const { lang, search } = useMarketingLocation();
  const copy = marketingCopy(lang);
  const home = withMarketingLang("/", lang);

  return (
    <div className="mkt-page mkt-notfound">
      <div className="mkt-section">
        <div className="mkt-section-head">
          <h1>{copy.notFoundTitle}</h1>
          <p>{copy.notFoundLede}</p>
        </div>
        <div className="mkt-cta-row">
          <Link href={home} className="mkt-btn mkt-btn-primary">
            {copy.notFoundHome}
          </Link>
        </div>
        <MarketingSearch id="mkt-notfound-q" lang={lang} search={search} />
      </div>
    </div>
  );
}
