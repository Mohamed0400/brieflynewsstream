"use client";

import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react";
import { FocusEvent, FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { BrandLoader } from "@/components/media/BrandLoader";

const SCROLL_FLAG = "homepage-search-scroll";

type SearchParams = {
  lang?: string;
  category?: string;
  country?: string;
  nationality?: string;
  sort?: string;
  from?: string;
  to?: string;
};

function buildHref(query: string, params: SearchParams) {
  const search = new URLSearchParams();
  if (params.lang && params.lang !== "ar") search.set("lang", params.lang);
  if (params.category) search.set("category", params.category);
  if (params.country) search.set("country", params.country);
  if (params.nationality) search.set("nationality", params.nationality);
  if (params.sort && params.sort !== "date") search.set("sort", params.sort);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);

  const normalized = query.trim().replace(/\s+/g, " ").slice(0, 200);
  if (normalized) search.set("q", normalized);

  const value = search.toString();
  return value ? `/news?${value}` : "/news";
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

function normalizedQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").slice(0, 200);
}

function scrollToFirstArticle() {
  const target =
    document.getElementById("homepage-first-article") ??
    document.getElementById("homepage-feed");
  if (!target) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
    inline: "nearest",
  });
}

function consumeScrollToFeed() {
  if (sessionStorage.getItem(SCROLL_FLAG) !== "1") return;
  sessionStorage.removeItem(SCROLL_FLAG);
  requestAnimationFrame(() => {
    requestAnimationFrame(scrollToFirstArticle);
  });
}

export function HomepageSearchBar({
  initialQuery,
  searchPlaceholder,
  searchButton,
  searchingLabel,
  searchClearLabel,
  params,
}: {
  initialQuery: string;
  searchPlaceholder: string;
  searchButton: string;
  searchingLabel: string;
  searchClearLabel: string;
  params: SearchParams;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const committedQueryRef = useRef(initialQuery);
  const pendingQueryRef = useRef<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const loading = searching || (isPending && pendingQueryRef.current !== null);

  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) return;
    setQuery(initialQuery);
    committedQueryRef.current = initialQuery;
  }, [initialQuery]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-home-search", loading);
    const overlay = document.querySelector(".homepage-feed-searching");
    overlay?.setAttribute("aria-hidden", loading ? "false" : "true");
    document.getElementById("homepage-feed")?.setAttribute("aria-busy", loading ? "true" : "false");

    return () => {
      document.documentElement.removeAttribute("data-home-search");
      document.querySelector(".homepage-feed-searching")?.setAttribute("aria-hidden", "true");
      document.getElementById("homepage-feed")?.setAttribute("aria-busy", "false");
    };
  }, [loading]);

  useEffect(() => {
    if (isPending) return;

    const pending = pendingQueryRef.current;
    if (pending !== null && initialQuery !== pending) return;

    if (pending !== null) {
      pendingQueryRef.current = null;
      setSearching(false);
    }

    consumeScrollToFeed();
  }, [initialQuery, isPending]);

  function navigate(nextQuery: string) {
    const href = buildHref(nextQuery, params);
    const normalized = normalizedQuery(nextQuery);
    if (href === currentPath()) {
      pendingQueryRef.current = null;
      sessionStorage.removeItem(SCROLL_FLAG);
      setSearching(false);
      committedQueryRef.current = normalized;
      return;
    }

    pendingQueryRef.current = normalized;
    committedQueryRef.current = normalized;
    sessionStorage.setItem(SCROLL_FLAG, "1");
    setSearching(true);
    inputRef.current?.blur();
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(query);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const next = event.relatedTarget;
    if (next instanceof HTMLElement && event.currentTarget.form?.contains(next)) return;
    if (normalizedQuery(query) === normalizedQuery(committedQueryRef.current)) return;
    navigate(query);
  }

  return (
    <form
      className="homepage-search-bar"
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search market news"
      aria-busy={loading}
    >
      <div className="homepage-search-field">
        <input
          ref={inputRef}
          id="homepage-search"
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={handleBlur}
          placeholder={searchPlaceholder}
          aria-label="Search articles"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query ? (
          <button
            type="button"
            className="homepage-search-clear"
            aria-label={searchClearLabel}
            onClick={() => {
              setQuery("");
              navigate("");
              inputRef.current?.focus();
            }}
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        className={`homepage-search-button${loading ? " is-loading" : ""}`}
        aria-live="polite"
      >
        {loading ? (
          <>
            <BrandLoader size="sm" decorative />
            <span>{searchingLabel}</span>
          </>
        ) : (
          searchButton
        )}
      </button>
    </form>
  );
}
