import { load } from "cheerio";
import Parser from "rss-parser";
import type { Source } from "@prisma/client";
import { z } from "zod";
import { cleanText } from "./classify";
import { applyLimit, limits } from "./limits";
import {
  audienceValue,
  NATIONALITY_OPTIONS,
} from "./nationalities";

export type CollectedItem = {
  externalId: string;
  title: string;
  url: string;
  summary: string;
  publisher?: string;
  audienceCodes?: string;
  imageUrl?: string;
  publishedAt: Date;
  rawJson: string;
};

const parser = new Parser();
const headers = {
  "user-agent": "GoldStandardMarketNews/1.0 (+news aggregation; contact site owner)",
  accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html",
};

function validDate(value: string | undefined) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.text();
}

function assertRssPayload(xml: string, url: string) {
  const trimmed = xml.trim();
  if (/^<!doctype html|^<html[\s>]/i.test(trimmed)) {
    throw new Error(`Feed URL returned HTML instead of RSS: ${url}`);
  }
}

function repairRssXml(xml: string) {
  return xml.replace(
    /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;|[a-zA-Z]+;)/g,
    "&amp;",
  );
}

function textLink(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.href === "string") return record.href;
    const attrs = record.$ as Record<string, unknown> | undefined;
    if (typeof attrs?.href === "string") return attrs.href;
  }
  return "";
}

function rssLinkFromEntry(entry: string) {
  const linkTag = entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1];
  if (linkTag && !/^<[^>]+>/.test(linkTag.trim())) return cleanText(linkTag);
  const href = entry.match(/<link[^>]*href="([^"]+)"/i)?.[1];
  return cleanText(href);
}

function collectRssFallback(xml: string, source: Source): CollectedItem[] {
  const $ = load(repairRssXml(xml), { xmlMode: true });
  const items: CollectedItem[] = [];
  $("item, entry").each((_, element) => {
    const entry = $.html(element) ?? "";
    const url = rssLinkFromEntry(entry);
    const title = xmlTag(entry, "title");
    if (!url || !title) return;
    const summary = xmlTag(entry, "description")
      || xmlTag(entry, "summary")
      || xmlTag(entry, "content");
    const published = xmlTag(entry, "pubDate")
      || xmlTag(entry, "published")
      || xmlTag(entry, "updated");
    const externalId = xmlTag(entry, "guid") || xmlTag(entry, "id") || url;
    items.push({
      externalId,
      title,
      url,
      summary,
      publisher: source.name,
      publishedAt: validDate(published),
      rawJson: JSON.stringify({ title, url, summary, published }),
    });
  });
  return items;
}

function rssPlainText(value: unknown) {
  const raw = cleanText(value);
  if (raw) return raw;
  if (typeof value === "string" && value.includes("<")) {
    return cleanText(load(value).text());
  }
  return "";
}

async function collectRss(source: Source): Promise<CollectedItem[]> {
  const xml = repairRssXml(await fetchText(source.url));
  assertRssPayload(xml, source.url);
  let feed;
  try {
    feed = await parser.parseString(xml);
  } catch {
    const fallback = collectRssFallback(xml, source);
    if (fallback.length === 0) throw new Error("Feed not recognized as RSS 1 or 2.");
    return applyLimit(fallback, rssLimit(source));
  }
  const items = (feed.items ?? []).flatMap((item) => {
    const link = item.link;
    const url = (typeof link === "string" ? link : textLink(link))?.trim();
    const title = rssPlainText(item.title);
    if (!url || !title) return [];
    const media = item as typeof item & {
      enclosure?: { url?: string };
      "media:content"?: { $?: { url?: string } };
    };
    return [{
      externalId: item.guid || item.id || url,
      title,
      url,
      summary: cleanText(item.contentSnippet || item.content || item.summary),
      publisher: source.name,
      imageUrl: media.enclosure?.url || media["media:content"]?.$?.url,
      publishedAt: validDate(item.isoDate || item.pubDate),
      rawJson: JSON.stringify(item),
    }];
  });
  return applyLimit(items, rssLimit(source));
}

function rssLimit(source: Source) {
  return source.code.startsWith("GNEWS_") ? limits.googleNewsRss : limits.rss;
}

function dateFromText(value: string) {
  const match = value.match(
    /(?:\d{1,2}\s+[A-Z][a-z]+\s+20\d{2}|[A-Z][a-z]+\s+\d{1,2},\s+20\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})/,
  );
  return validDate(match?.[0]);
}

async function collectHtml(source: Source): Promise<CollectedItem[]> {
  const html = await fetchText(source.url);
  const $ = load(html);
  const rules: Record<string, { link: RegExp; origin: string }> = {
    "kitco-html": { link: /\/news\/article\//, origin: "https://www.kitco.com" },
    "goldhub-html": { link: /\/goldhub\/gold-focus\/20\d{2}\//, origin: "https://www.gold.org" },
    "cbk-html": { link: /press-releases\//, origin: "https://www.cbk.gov.kw" },
    "kuna-html": { link: /ArticleDetails\.aspx/i, origin: "https://www.kuna.net.kw" },
  };
  const rule = rules[source.adapter];
  if (!rule) throw new Error(`Unknown adapter: ${source.adapter}`);

  const seen = new Set<string>();
  const items: CollectedItem[] = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !rule.link.test(href)) return;
    const absoluteUrl = new URL(href, rule.origin).toString();
    const url = source.adapter === "kuna-html" ? absoluteUrl : absoluteUrl.split("?")[0];
    const title = cleanText($(element).text() || $(element).attr("title"));
    if (title.length < 18 || seen.has(url)) return;
    seen.add(url);
    const container = $(element).closest("article, li, .card, .views-row, .media, div");
    const summary = source.adapter === "kuna-html"
      ? ""
      : cleanText(container.text()).slice(0, 700);
    const image = container.find("img").first().attr("src");
    const datetime = container.find("time").first().attr("datetime");
    items.push({
      externalId: url,
      title,
      url,
      summary: summary === title ? "" : summary,
      publisher: source.name,
      imageUrl: image ? new URL(image, rule.origin).toString() : undefined,
      publishedAt: datetime ? validDate(datetime) : dateFromText(summary),
      rawJson: JSON.stringify({ href, title, summary, datetime }),
    });
  });
  return applyLimit(items, limits.html);
}

function xmlTag(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(
    new RegExp(`<${escaped}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${escaped}>`, "i"),
  );
  return cleanText(match?.[1]);
}

function titleFromUrl(url: string) {
  const acronyms = new Set(["us", "uk", "ai", "fed", "ecb", "gdp", "cpi", "usd", "eu", "opec"]);
  const slug = new URL(url).pathname
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/-20\d{2}-\d{2}-\d{2}$/, "") ?? "";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => acronyms.has(part) ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

async function collectSitemap(source: Source): Promise<CollectedItem[]> {
  const xml = await fetchText(source.url);
  const $ = load(xml, { xmlMode: true });
  const items: CollectedItem[] = [];
  $("url").each((_, element) => {
    const entry = $.html(element);
    const url = xmlTag(entry, "loc");
    if (!url) return;
    const title = source.adapter === "bloomberg-sitemap"
      ? xmlTag(entry, "news:title")
      : titleFromUrl(url);
    if (title.length < 18) return;
    const published = xmlTag(entry, "news:publication_date") || xmlTag(entry, "lastmod");
    items.push({
      externalId: url,
      title,
      url,
      summary: "",
      publisher: source.name,
      imageUrl: xmlTag(entry, "image:loc") || undefined,
      publishedAt: validDate(published),
      rawJson: JSON.stringify({ title, url, published }),
    });
  });
  return applyLimit(items, limits.sitemap);
}

const groundedNewsSchema = z.object({
  articles: z.array(z.object({
    title: z.string().min(10),
    summary: z.string().min(20),
    url: z.string().url(),
    sourceName: z.string().min(2),
    publishedAt: z.string(),
  })),
});

const TRUSTED_GROUNDED_DOMAINS = [
  "reuters.com", "bloomberg.com", "bbc.com", "bbc.co.uk", "cnbc.com",
  "marketwatch.com", "ft.com", "wsj.com", "apnews.com", "kitco.com",
  "mining.com", "northernminer.com", "cnbc.com", "gulfnews.com",
  "gold.org", "investing.com", "bullionvault.com", "dtnpf.com",
  "federalreserve.gov", "ecb.europa.eu", "imf.org", "worldbank.org",
  "kuna.net.kw", "cbk.gov.kw", "qna.org.qa",
  "aljazeera.com", "arabnews.com", "thenationalnews.com", "dawn.com",
  "thehindu.com", "indianexpress.com", "inquirer.net", "pna.gov.ph",
  "rappler.com", "antaranews.com", "dailynews.lk", "africanews.com",
  "ahram.org.eg", "egypttoday.com", "dhakatribune.com",
  "arabtimesonline.com", "timeskuwait.com", "sana.sy",
  "cp24.com", "bssnews.net", "arabnews.pk", "saudigazette.com",
  "marinelink.com", "theguardian.com", "cnbcafrica.com", "gov.cn",
  "police.uk", "khaama.com", "chinadaily.com.cn", "sharjah24.ae",
];

export function isTrustedGroundedUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return TRUSTED_GROUNDED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function collectGeminiGroundedNews(): Promise<CollectedItem[]> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key || process.env.GOOGLE_GROUNDED_SEARCH_ENABLED !== "true") return [];
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const requestCount = limits.geminiSearch > 0 ? limits.geminiSearch : 50;
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model,
      input: [
        `Today is ${new Date().toISOString()}. Use Google Search to find as many important news reports as possible published in the last 48 hours for people interested in gold and financial markets. Return up to ${requestCount} items.`,
        "Focus on gold/silver, central banks, interest rates, inflation, USD/FX, equities, oil when market-moving, and Kuwait/GCC economics.",
        "Prefer original reporting from established agencies, official institutions, and reputable financial publishers. Exclude sports, entertainment, lifestyle, opinion without new facts, sponsored releases, and duplicates.",
        "Every item must have an original publisher URL (never a Google search/redirect URL), a factual two-sentence summary, publisher name, and ISO publication timestamp. Do not invent missing facts or URLs.",
      ].join("\n"),
      tools: [{ type: "google_search" }],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["articles"],
          properties: {
            articles: {
              type: "array",
              maxItems: requestCount,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "summary", "url", "sourceName", "publishedAt"],
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  url: { type: "string" },
                  sourceName: { type: "string" },
                  publishedAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
  });
  const payload = await response.json() as {
    steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${payload.error?.message || "request failed"}`);
  const finalOutput = payload.steps?.filter((step) => step.type === "model_output").at(-1);
  const outputText = (finalOutput?.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("") || "";
  const parsed = groundedNewsSchema.parse(JSON.parse(outputText || "{}"));
  const items = parsed.articles
    .filter((article) => isTrustedGroundedUrl(article.url))
    .map((article) => ({
      externalId: article.url,
      title: cleanText(article.title),
      summary: cleanText(article.summary),
      publisher: cleanText(article.sourceName),
      url: article.url,
      publishedAt: validDate(article.publishedAt),
      rawJson: JSON.stringify({ provider: "gemini-google-search", ...article }),
    }));
  return applyLimit(items, limits.geminiSearch);
}

const nationalityCodes = NATIONALITY_OPTIONS.map((option) => option.code);
const nationalityGroundedSchema = z.object({
  articles: z.array(z.object({
    title: z.string().min(10),
    summary: z.string().min(20),
    url: z.string().url(),
    sourceName: z.string().min(2),
    publishedAt: z.string(),
    nationalityCodes: z.string().min(2),
  })),
});

async function collectNationalityGroundedNews(): Promise<CollectedItem[]> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key || process.env.GOOGLE_GROUNDED_SEARCH_ENABLED !== "true") return [];

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  // Interactions structured output currently rejects larger maxItems values.
  // This is a per-request provider cap; the environment limit still controls retained output.
  const requestCount = Math.min(
    limits.nationalitySearch > 0 ? limits.nationalitySearch : 60,
    30,
  );
  const audienceList = NATIONALITY_OPTIONS
    .map((option) => `${option.code}=${option.country}`)
    .join(", ");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model,
      input: [
        `Today is ${new Date().toISOString()}. Use Google Search to find up to ${requestCount} important, factual news reports from the last ${limits.nationalityMaxAgeHours} hours for expatriate communities living in Kuwait.`,
        `Cover these audience countries using only the listed ISO codes: ${audienceList}.`,
        "Aim for one report per listed country before adding a second report for any country. The report should primarily concern current events in that home country, or a bilateral, consular, visa, labor or remittance development that specifically affects that community in Kuwait. Do not fill the result with general Kuwait-only news.",
        "Prioritize developments a resident would want in a two-minute national briefing: major government decisions, economy and jobs, visas and labor, remittances, safety or disasters, major transport disruption, and genuinely important national events.",
        "Prefer original reporting from established news agencies, official institutions and reputable national publishers. Exclude sport, celebrity, lifestyle, opinion, sponsored releases, rumors and duplicate coverage.",
        "Tag every report with all directly relevant nationalityCodes as a comma-separated ISO-code string, for example IN or EG,SD. Use original publisher URLs only, never Google redirects. Do not invent facts, timestamps or links.",
      ].join("\n"),
      tools: [{ type: "google_search" }],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["articles"],
          properties: {
            articles: {
              type: "array",
              maxItems: requestCount,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "summary", "url", "sourceName", "publishedAt", "nationalityCodes"],
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  url: { type: "string" },
                  sourceName: { type: "string" },
                  publishedAt: { type: "string" },
                  nationalityCodes: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    }),
  });
  const payload = await response.json() as {
    steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    error?: { message?: string; status?: string; details?: unknown };
  };
  if (!response.ok) {
    throw new Error(
      `Gemini nationality search ${response.status}: ${
        payload.error ? JSON.stringify(payload.error) : "request failed"
      }`,
    );
  }
  const finalOutput = payload.steps?.filter((step) => step.type === "model_output").at(-1);
  const outputText = (finalOutput?.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("");
  const parsed = nationalityGroundedSchema.parse(JSON.parse(outputText || "{}"));
  if (process.env.DEBUG_COLLECTION === "true") {
    console.log(JSON.stringify({ nationalityCandidates: parsed.articles }, null, 2));
  }
  const oldestAllowed = Date.now() - limits.nationalityMaxAgeHours * 60 * 60 * 1000;
  const newestAllowed = Date.now() + 6 * 60 * 60 * 1000;
  const allowedCodes = new Set(nationalityCodes);

  const items = parsed.articles.flatMap((article) => {
    const publishedAt = validDate(article.publishedAt);
    const codes = [...new Set(article.nationalityCodes.split(",").map((code) => code.trim().toUpperCase()))]
      .filter((code) => allowedCodes.has(code));
    if (
      !isTrustedGroundedUrl(article.url) ||
      !codes.length ||
      publishedAt.getTime() < oldestAllowed ||
      publishedAt.getTime() > newestAllowed
    ) {
      return [];
    }
    return [{
      externalId: article.url,
      title: cleanText(article.title),
      summary: cleanText(article.summary),
      publisher: cleanText(article.sourceName),
      audienceCodes: audienceValue(codes),
      url: article.url,
      publishedAt,
      rawJson: JSON.stringify({ provider: "gemini-nationality-search", ...article }),
    }];
  });
  return applyLimit(items, limits.nationalitySearch);
}

export async function collectSource(source: Source) {
  if (source.adapter === "rss") return collectRss(source);
  if (source.adapter === "gemini-search") return collectGeminiGroundedNews();
  if (source.adapter === "gemini-nationality-search") return collectNationalityGroundedNews();
  if (source.adapter.endsWith("-sitemap")) return collectSitemap(source);
  return collectHtml(source);
}
