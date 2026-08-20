import type { MetadataRoute } from "next";
import { CATEGORY_META } from "@/lib/market";
import { publicSiteUrl } from "@/lib/site-url";
import { supportedCountryCodes } from "@/lib/supported-countries";

function languageAlternates(origin: string, arabicPath: string, englishPath: string) {
  return {
    languages: {
      ar: `${origin}${arabicPath}`,
      en: `${origin}${englishPath}`,
      "x-default": `${origin}${arabicPath}`,
    },
  };
}

function entry(
  origin: string,
  arabicPath: string,
  englishPath: string,
  options: {
    lastModified: Date;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  },
): MetadataRoute.Sitemap[number] {
  return {
    url: `${origin}${arabicPath === "/" ? "" : arabicPath}` || origin,
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: languageAlternates(origin, arabicPath, englishPath),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicSiteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    entry(origin, "/", "/?lang=en", { lastModified: now, changeFrequency: "weekly", priority: 1 }),
    {
      url: `${origin}/?lang=en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.98,
      alternates: languageAlternates(origin, "/", "/?lang=en"),
    },
    entry(origin, "/news", "/news?lang=en", { lastModified: now, changeFrequency: "hourly", priority: 0.95 }),
    {
      url: `${origin}/news?lang=en`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.92,
      alternates: languageAlternates(origin, "/news", "/news?lang=en"),
    },
    entry(origin, "/pricing", "/pricing?lang=en", { lastModified: now, changeFrequency: "weekly", priority: 0.9 }),
    {
      url: `${origin}/pricing?lang=en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.88,
      alternates: languageAlternates(origin, "/pricing", "/pricing?lang=en"),
    },
    entry(origin, "/developers", "/developers?lang=en", { lastModified: now, changeFrequency: "weekly", priority: 0.9 }),
    {
      url: `${origin}/developers?lang=en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.88,
      alternates: languageAlternates(origin, "/developers", "/developers?lang=en"),
    },
    entry(origin, "/coverage", "/coverage?lang=en", { lastModified: now, changeFrequency: "weekly", priority: 0.85 }),
    {
      url: `${origin}/coverage?lang=en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.83,
      alternates: languageAlternates(origin, "/coverage", "/coverage?lang=en"),
    },
  ];

  for (const code of supportedCountryCodes()) {
    if (code === "GLOBAL") continue;
    const arabicPath = `/news?country=${code}`;
    const englishPath = `/news?lang=en&country=${code}`;
    entries.push({
      url: `${origin}${arabicPath}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
      alternates: languageAlternates(origin, arabicPath, englishPath),
    });
  }

  for (const category of CATEGORY_META) {
    const arabicPath = `/news?category=${category.code}`;
    const englishPath = `/news?lang=en&category=${category.code}`;
    entries.push({
      url: `${origin}${arabicPath}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.65,
      alternates: languageAlternates(origin, arabicPath, englishPath),
    });
  }

  return entries;
}
