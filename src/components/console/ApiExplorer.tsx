"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { toast } from "@/lib/toast";
import { CATEGORY_META } from "@/lib/market";

type Option = { value: string; label: string };

type ExplorerArticle = {
  id: string;
  category: string;
  secondaryTags: string[];
  country: string;
  region: string;
  nationalityCodes: string[];
  title: string;
  summary: string;
  titleAr?: string | null;
  titleEn?: string | null;
  summaryAr?: string | null;
  summaryEn?: string | null;
  translated?: boolean;
  url: string;
  source: string;
  publishedAt: string;
  scores: {
    final: number;
    relevance: number;
    marketImpact: number;
    goldImpact: number;
  } | null;
};

type ApiResponse = {
  count: number;
  limit: number;
  offset: number;
  filters: Record<string, unknown>;
  items: ExplorerArticle[];
};

type ExplorerPayload = {
  ok?: boolean;
  status: number;
  durationMs: number;
  requestPath: string;
  error?: string | null;
  message?: string | null;
  response: ApiResponse | { error?: string; message?: string } | null;
};

type Filters = {
  q: string;
  searchIn: string;
  category: string;
  country: string;
  region: string;
  nationality: string;
  source: string;
  language: string;
  lang: string;
  from: string;
  to: string;
  sort: string;
  limit: string;
};

const API_KEY_STORAGE = "mna.explorer.apiKey";
const SEARCH_DEBOUNCE_MS = 350;
const MIN_LOADING_MS = 280;

const initialFilters: Filters = {
  q: "",
  searchIn: "both",
  category: "",
  country: "",
  region: "",
  nationality: "",
  source: "",
  language: "",
  lang: "ar",
  from: "",
  to: "",
  sort: "score",
  limit: "20",
};

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="explorer-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function buildRequestParams(filters: Filters, offset: number) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim().replace(/\s+/g, " ").slice(0, 200));
  if (filters.searchIn && filters.searchIn !== "both") params.set("searchIn", filters.searchIn);
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.region) params.set("region", filters.region);
  if (filters.nationality) params.set("nationality", filters.nationality);
  if (filters.source) params.set("source", filters.source);
  if (filters.language) params.set("language", filters.language);
  params.set("lang", filters.lang === "en" ? "en" : "ar");
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sort && filters.sort !== "score") params.set("sort", filters.sort);
  params.set("limit", filters.limit || "20");
  params.set("offset", String(offset));
  return params;
}

function maskApiKey(value: string) {
  const key = value.trim();
  if (key.length < 8) return "X-API-Key";
  return `X-API-Key: ${"•".repeat(Math.min(12, key.length - 4))}${key.slice(-4)}`;
}

function localizedExplorerText(article: ExplorerArticle, lang: string) {
  const arabic = /[\u0600-\u06ff]/;
  if (lang === "ar") {
    return {
      title: (article.titleAr && arabic.test(article.titleAr) ? article.titleAr : null) || article.title,
      summary: (article.summaryAr && arabic.test(article.summaryAr) ? article.summaryAr : null) || article.summary,
    };
  }
  return {
    title: article.titleEn || article.title,
    summary: article.summaryEn || article.summary,
  };
}

function categoryLabel(code: string, lang: string) {
  const meta = CATEGORY_META.find((item) => item.code === code);
  if (!meta) return code.replaceAll("_", " ");
  return lang === "ar" ? meta.labelAr : meta.label;
}

function readApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as Record<string, unknown>;
  const candidate = [body.message, body.error]
    .find((value) => typeof value === "string" && value.trim());
  return typeof candidate === "string" ? candidate.trim() : fallback;
}

export function ApiExplorer({
  categories,
  countries,
  regions,
  nationalities,
  sources,
  accountKeys = [],
}: {
  categories: Option[];
  countries: Option[];
  regions: Option[];
  nationalities: Option[];
  sources: Option[];
  accountKeys?: { id: string; label: string }[];
}) {
  const { copy } = useConsoleCopy();
  const text = copy.explorer;
  const [filters, setFilters] = useState(initialFilters);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [payload, setPayload] = useState<ExplorerPayload | null>(null);
  const [activePath, setActivePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"results" | "json">("results");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(API_KEY_STORAGE);
      if (stored) setApiKey(stored);
    } catch {
      // Ignore blocked storage in locked-down browsers.
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, []);

  const activeFilterCount = useMemo(() => (
    Object.entries(filters).filter(([key, value]) => (
      value && !["searchIn", "language", "lang", "sort", "limit"].includes(key)
    )).length
  ), [filters]);

  function persistApiKey(value: string) {
    setApiKey(value);
    try {
      if (value.trim()) sessionStorage.setItem(API_KEY_STORAGE, value.trim());
      else sessionStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // Ignore blocked storage.
    }
  }

  function update(name: keyof Filters, value: string) {
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
    if (name === "lang" && apiKey.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void runSearch(0, nextFilters);
    }
  }

  async function runSearch(offset = 0, nextFilters = filtersRef.current, nextKey = apiKey) {
    const key = nextKey.trim();
    if (!key) {
      const message = text.keyRequired;
      setError(message);
      toast.warning(message, text.keyRequiredTitle);
      setPayload(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    setRequestDone(false);
    setLoading(true);
    setError("");

    const params = buildRequestParams(nextFilters, offset);
    const requestPath = `/api/v1/market-news?${params}`;
    setActivePath(requestPath);
    const startedAt = performance.now();

    try {
      const response = await fetch(requestPath, {
        headers: { "X-API-Key": key },
        cache: "no-store",
        signal: controller.signal,
      });
      const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
      const raw = await response.text();
      let apiBody: ApiResponse | { error?: string; message?: string };
      try {
        apiBody = JSON.parse(raw) as ApiResponse | { error?: string; message?: string };
      } catch {
        throw new Error(
          response.ok
            ? text.nonJson
            : text.requestFailedBody(response.status, raw.slice(0, 280)),
        );
      }

      const message = response.ok ? null : readApiError(apiBody, text.requestFailed);
      const body: ExplorerPayload = {
        ok: response.ok,
        status: response.status,
        durationMs,
        requestPath,
        error: message,
        message,
        response: apiBody,
      };
      setPayload(body);
      if (!response.ok) {
        const nextError = response.status === 401
          ? text.rejected
          : message || `The API returned HTTP ${response.status}.`;
        setError(nextError);
        toast.error(nextError, `API error · HTTP ${response.status}`);
        setView("json");
        return;
      }
      setView("results");
      setFiltersOpen(false);
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
      }
      if (abortRef.current !== controller) return;
      setRequestDone(true);
      doneTimerRef.current = setTimeout(() => setRequestDone(false), 1600);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setPayload(null);
      const nextError = requestError instanceof Error ? requestError.message : text.requestFailed;
      setError(nextError);
      toast.exception(requestError, nextError);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  function scheduleSearch(nextQuery: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!apiKey.trim()) return;
    debounceRef.current = setTimeout(() => {
      void runSearch(0, { ...filtersRef.current, q: nextQuery });
    }, SEARCH_DEBOUNCE_MS);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void runSearch(0);
  }

  function reset() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilters(initialFilters);
    setPayload(null);
    setError("");
  }

  const response = payload?.response && "items" in payload.response ? payload.response : undefined;
  const failedResponse = payload?.response && !response ? payload.response : null;
  const start = response?.count ? response.offset + 1 : 0;
  const end = response ? Math.min(response.offset + response.items.length, response.count) : 0;

  return (
    <div className="explorer-workspace">
      <div className="explorer-toolbar">
        <div>
          <h1>{text.heading}</h1>
          <p>
            {text.description}
          </p>
        </div>
        <button
          type="button"
          className="console-secondary-button explorer-filter-toggle"
          onClick={() => setFiltersOpen((value) => !value)}
          aria-expanded={filtersOpen}
          aria-controls="explorer-filters"
        >
          {filtersOpen ? text.hideFilters : `${text.filters}${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
        </button>
      </div>

      <div className="explorer-key-bar">
        <label className="explorer-field" htmlFor="explorer-api-key">
          <span>{text.apiKey}</span>
          <input
            id="explorer-api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(event) => persistApiKey(event.target.value)}
            placeholder="mna_live_… or mna_test_…"
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            lang="en"
          />
        </label>
        <button
          type="button"
          className="console-secondary-button"
          onClick={() => setShowKey((value) => !value)}
        >
          {showKey ? text.hideKey : text.showKey}
        </button>
        <p>
          {text.keyHint}{" "}
          <Link href="/console/keys">{text.keysLink}</Link>
          {accountKeys.length > 0 ? (
            <>
              {" "}
              · {accountKeys.length} active on this account
              ({accountKeys.slice(0, 3).map((key) => key.label).join("; ")}
              {accountKeys.length > 3 ? "…" : ""})
            </>
          ) : (
            <> · Create a key in this account before exploring.</>
          )}
        </p>
      </div>

      <div className="explorer-layout">
        <aside
          id="explorer-filters"
          className="explorer-filters"
          data-open={filtersOpen ? "true" : "false"}
        >
          <form onSubmit={submit}>
            <div className="explorer-filter-heading">
              <div>
                <h2>{text.requestFilters}</h2>
                <p>{text.requestFiltersHint}</p>
              </div>
              <button type="button" onClick={reset}>{text.reset}</button>
            </div>

            <label className="explorer-field" htmlFor="explorer-query">
              <span>{text.searchText}</span>
              <input
                id="explorer-query"
                name="q"
                type="search"
                inputMode="search"
                dir="auto"
                enterKeyHint="search"
                value={filters.q}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  update("q", nextQuery);
                  scheduleSearch(nextQuery);
                }}
                placeholder="ذهب مصر، Egypt gold…"
              />
              <small>{text.searchHint}</small>
            </label>

            <SelectField
              id="explorer-lang"
              label={text.responseLanguage}
              value={filters.lang}
              onChange={(value) => update("lang", value)}
              options={[
                { value: "ar", label: text.arabicDefault },
                { value: "en", label: text.english },
              ]}
            />
            <SelectField
              id="explorer-search-in"
              label={text.searchIn}
              value={filters.searchIn}
              onChange={(value) => update("searchIn", value)}
              options={[
                { value: "both", label: text.titleAndSummary },
                { value: "title", label: text.titleOnly },
                { value: "summary", label: text.summaryOnly },
              ]}
            />
            <SelectField id="explorer-category" label={text.category} value={filters.category} onChange={(value) => update("category", value)} options={categories} />
            <SelectField id="explorer-region" label={text.region} value={filters.region} onChange={(value) => update("region", value)} options={regions} />
            <SelectField id="explorer-country" label={text.articleCountry} value={filters.country} onChange={(value) => update("country", value)} options={countries} />
            <SelectField id="explorer-nationality" label={text.nationality} value={filters.nationality} onChange={(value) => update("nationality", value)} options={nationalities} />
            <SelectField id="explorer-source" label={text.source} value={filters.source} onChange={(value) => update("source", value)} options={sources} />
            <SelectField
              id="explorer-language"
              label={text.sourceLanguage}
              value={filters.language}
              onChange={(value) => update("language", value)}
              options={[
                { value: "", label: text.anyLanguage },
                { value: "ar", label: text.arabicSource },
                { value: "en", label: text.englishSource },
              ]}
            />

            <fieldset className="explorer-date-group">
              <legend>{text.dateRange}</legend>
              <label className="explorer-field" htmlFor="explorer-from">
                <span>{text.from}</span>
                <input id="explorer-from" type="date" dir="ltr" value={filters.from} onChange={(event) => update("from", event.target.value)} />
              </label>
              <label className="explorer-field" htmlFor="explorer-to">
                <span>{text.to}</span>
                <input id="explorer-to" type="date" dir="ltr" value={filters.to} onChange={(event) => update("to", event.target.value)} />
              </label>
            </fieldset>

            <div className="explorer-filter-row">
              <SelectField
                id="explorer-sort"
                label={text.sort}
                value={filters.sort}
                onChange={(value) => update("sort", value)}
                options={[
                  { value: "score", label: text.marketImpact },
                  { value: "date", label: text.newest },
                ]}
              />
              <SelectField
                id="explorer-limit"
                label={text.results}
                value={filters.limit}
                onChange={(value) => update("limit", value)}
                options={[
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
              />
            </div>

            <button
              type="submit"
              className="console-primary-button explorer-run-button"
              disabled={loading}
              aria-busy={loading}
              data-state={loading ? "loading" : requestDone ? "done" : undefined}
            >
              {loading ? text.running : requestDone ? text.done : text.run}
            </button>
          </form>
        </aside>

        <section
          className="explorer-results"
          aria-labelledby="explorer-results-heading"
          aria-busy={loading}
        >
          <div className="explorer-request-bar" dir="ltr">
            <span>GET</span>
            <code>{activePath || payload?.requestPath || "/api/v1/market-news?limit=20"}</code>
            {(payload || loading) && (
              <div className="explorer-request-meta">
                {payload && !loading ? <strong>{payload.status}</strong> : null}
                {payload && !loading ? <span>{payload.durationMs} ms</span> : null}
                <span>{maskApiKey(apiKey)}</span>
                {loading ? <span>{text.loading}</span> : null}
                {!loading && requestDone ? <span data-state="done">{text.done}</span> : null}
              </div>
            )}
          </div>

          {(payload || loading) && (
            <div className="explorer-results-header">
              <div>
                <h2 id="explorer-results-heading">
                  {loading
                    ? text.loading
                    : error
                    ? text.responseError
                    : text.matching((response?.count ?? 0).toLocaleString(copy.locale))}
                </h2>
                <p>
                  {loading
                    ? text.running
                    : error
                    ? text.responseErrorHint
                    : text.shown(start, end)}
                </p>
              </div>
              <div className="explorer-view-tabs" role="tablist" aria-label={text.viewAria}>
                <button type="button" role="tab" aria-selected={view === "results"} onClick={() => setView("results")}>{text.resultsTab}</button>
                <button type="button" role="tab" aria-selected={view === "json"} onClick={() => setView("json")}>{text.jsonTab}</button>
              </div>
            </div>
          )}

          {error && (
            <div className="explorer-error" role="alert">
              <strong>{text.requestFailed}{payload?.status ? ` · HTTP ${payload.status}` : ""}</strong>
              <p>{error}</p>
              {failedResponse && "error" in failedResponse && failedResponse.error && (
                <p><code>{failedResponse.error}</code></p>
              )}
              <button type="button" className="console-secondary-button" onClick={() => void runSearch(0)}>{text.tryAgain}</button>
            </div>
          )}

          {loading && (
            <div className="explorer-loading" role="status" aria-live="polite" aria-label={text.loading}>
              <p>{text.loading}</p>
              {Array.from({ length: 5 }, (_, index) => <span key={index} />)}
            </div>
          )}

          {!loading && !error && !payload && (
            <div className="explorer-empty-state">
              <strong>{apiKey.trim() ? text.ready : text.addKey}</strong>
              <p>
                {apiKey.trim() ? text.readyHint : text.addKeyHint}
              </p>
              <button type="button" className="console-primary-button" onClick={() => void runSearch(0)}>
                {apiKey.trim() ? text.runDefault : text.run}
              </button>
            </div>
          )}

          {!loading && !error && payload && view === "results" && (
            response?.items.length ? (
              <div className="explorer-result-list" lang={filters.lang} dir={filters.lang === "ar" ? "rtl" : "ltr"}>
                {response.items.map((article) => {
                  const copy = localizedExplorerText(article, filters.lang);
                  return (
                  <article key={article.id} className="explorer-result">
                    <div className="explorer-result-meta">
                      <span>{categoryLabel(article.category, filters.lang)}</span>
                      <span>{article.country}</span>
                      <time dateTime={article.publishedAt}>
                        {new Intl.DateTimeFormat(filters.lang === "ar" ? "ar" : "en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Kuwait",
                        }).format(new Date(article.publishedAt))}
                      </time>
                    </div>
                    <h3><a href={article.url} target="_blank" rel="noreferrer">{copy.title}</a></h3>
                    <p>{copy.summary}</p>
                    <div className="explorer-result-footer">
                      <span>{article.source}</span>
                      {article.scores && (
                        <span>{text.impact} {Math.round(article.scores.final)}</span>
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            ) : (
              <div className="explorer-empty-state">
                <strong>{text.noMatches}</strong>
                <p>{text.noMatchesHint}</p>
                <button type="button" className="console-secondary-button" onClick={reset}>{text.clearFilters}</button>
              </div>
            )
          )}

          {!loading && payload && view === "json" && (
            <pre className="explorer-json" dir="ltr"><code>{JSON.stringify(payload.response ?? payload, null, 2)}</code></pre>
          )}

          {!loading && response && response.count > response.limit && (
            <nav className="explorer-pagination" aria-label={text.pagesAria}>
              <button
                type="button"
                className="console-secondary-button"
                disabled={response.offset === 0}
                onClick={() => void runSearch(Math.max(0, response.offset - response.limit))}
              >
                {text.previous}
              </button>
              <span>{text.pageStatus(start, end, response.count.toLocaleString(copy.locale))}</span>
              <button
                type="button"
                className="console-secondary-button"
                disabled={response.offset + response.limit >= response.count}
                onClick={() => void runSearch(response.offset + response.limit)}
              >
                {text.next}
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
