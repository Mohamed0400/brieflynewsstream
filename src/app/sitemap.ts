import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-url";

/**
 * Google-safe sitemap: clean path URLs only.
 * Avoid query-string locs + xhtml:link alternates here — GSC often rejects those
 * as "unable to recognize" entries. Language alternates live in page <head>.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicSiteUrl();
  const now = new Date();

  const paths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/news", changeFrequency: "hourly", priority: 0.95 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/developers", changeFrequency: "weekly", priority: 0.9 },
    { path: "/coverage", changeFrequency: "weekly", priority: 0.85 },
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${origin}/` : `${origin}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
