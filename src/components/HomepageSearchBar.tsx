"use client";

import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { BrandLoader } from "@/components/media/BrandLoader";

const SEARCH_DEBOUNCE_MS = 400;
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQueryRef = useRef<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const loading = searching || (isPending && pendingQueryRef.current !== null);

  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) return;
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

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
    if (href === currentPath()) {
      pendingQueryRef.current = null;
      sessionStorage.removeItem(SCROLL_FLAG);
      setSearching(false);
      return;
    }

    pendingQueryRef.current = normalizedQuery(nextQuery);
    sessionStorage.setItem(SCROLL_FLAG, "1");
    setSearching(true);
    inputRef.current?.blur();
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function scheduleNavigate(nextQuery: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(nextQuery), SEARCH_DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            pendingQueryRef.current = null;
            sessionStorage.removeItem(SCROLL_FLAG);
            setSearching(false);
            scheduleNavigate(nextQuery);
          }}
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
              pendingQueryRef.current = null;
              sessionStorage.removeItem(SCROLL_FLAG);
              setSearching(false);
              scheduleNavigate("");
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
