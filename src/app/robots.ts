import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/console", "/console/", "/api/", "/api"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https?:\/\//, ""),
  };
}
