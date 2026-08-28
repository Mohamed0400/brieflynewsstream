import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { MARKET_HUB_SLUGS } from "@/lib/market-hubs";
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
    // Archive hidden — route disabled until cold storage is working.
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/developers", changeFrequency: "weekly", priority: 0.9 },
    { path: "/coverage", changeFrequency: "weekly", priority: 0.85 },
    { path: "/guides", changeFrequency: "weekly", priority: 0.8 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/console/login", changeFrequency: "monthly", priority: 0.6 },
    { path: "/console/signup", changeFrequency: "monthly", priority: 0.6 },
    ...MARKET_HUB_SLUGS.map((slug) => ({
      path: `/markets/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.82,
    })),
    ...GUIDES.map((guide) => ({
      path: `/guides/${guide.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${origin}/` : `${origin}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
