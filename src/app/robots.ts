import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-url";

/** Public paths AI + search crawlers may index. */
const PUBLIC_ALLOW = [
  "/",
  "/news",
  "/pricing",
  "/developers",
  "/coverage",
  "/markets/",
  "/guides",
  "/guides/",
  "/privacy",
  "/terms",
  "/console/login",
  "/console/signup",
  "/favicon.ico",
  "/favicon-48x48.png",
  "/favicon-96x96.png",
  "/favicon-192x192.png",
  "/icon.png",
  "/apple-icon.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/brand/",
  "/llms.txt",
  "/sitemap.xml",
  "/news-sitemap.xml",
] as const;

const PUBLIC_DISALLOW = [
  "/console/",
  "/console",
  "/consoleofbrieflynewsstreamapi",
  "/consoleofbrieflynewsstreamapi/",
  "/api/",
  "/api",
  "/auth/",
] as const;

/** Search engines + answer-engine / AI Overview crawlers. */
const AI_AND_SEARCH_AGENTS = [
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "Applebot-Extended",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Bytespider",
  "CCBot",
  "meta-externalagent",
] as const;

export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [...PUBLIC_ALLOW],
        disallow: [...PUBLIC_DISALLOW],
      },
      ...AI_AND_SEARCH_AGENTS.map((userAgent) => ({
        userAgent,
        allow: [...PUBLIC_ALLOW],
        disallow: [...PUBLIC_DISALLOW],
      })),
    ],
    sitemap: [`${origin}/sitemap.xml`, `${origin}/news-sitemap.xml`],
    host: origin.replace(/^https?:\/\//, ""),
  };
}
