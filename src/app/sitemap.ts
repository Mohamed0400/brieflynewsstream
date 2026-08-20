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

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicSiteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: languageAlternates(origin, "/", "/?lang=en"),
    },
    {
      url: `${origin}/?lang=en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
      alternates: languageAlternates(origin, "/", "/?lang=en"),
    },
    {
      url: `${origin}/news`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
      alternates: languageAlternates(origin, "/news", "/news?lang=en"),
    },
    {
      url: `${origin}/news?lang=en`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.85,
      alternates: languageAlternates(origin, "/news", "/news?lang=en"),
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
      priority: 0.6,
      alternates: languageAlternates(origin, arabicPath, englishPath),
    });
  }

  return entries;
}
