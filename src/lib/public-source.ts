/** Customer-facing source labels. Do not surface collection vendors or adapters. */
export function publicSourceName(name: string) {
  return name
    .replace(/^Google News\s+/i, "")
    .replace(/\s+Coverage Fill$/i, "")
    .trim() || name;
}

export function publicHomepageUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "news.google.com" || host.endsWith(".news.google.com")) return null;
  } catch {
    return null;
  }
  return url;
}
