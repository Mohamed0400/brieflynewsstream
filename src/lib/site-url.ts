/**
 * Canonical public origin for SEO (sitemap, robots, Open Graph, JSON-LD).
 * Production serves on www; apex permanently redirects there on Vercel.
 */
export function publicSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "")
    .trim()
    .replace(/\/$/, "");

  if (!configured) return "http://localhost:3000";

  try {
    const url = new URL(configured);
    if (url.hostname === "brieflynewsstream.com") {
      url.hostname = "www.brieflynewsstream.com";
    }
    return url.origin;
  } catch {
    return configured;
  }
}
