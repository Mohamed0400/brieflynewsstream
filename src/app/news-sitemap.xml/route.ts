import { prisma } from "@/lib/prisma";
import { publicSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 300;

/** Google News-style sitemap of recent public story pages. */
export async function GET() {
  const origin = publicSiteUrl();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const articles = await prisma.article.findMany({
    where: { publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 1000,
    select: {
      id: true,
      publishedAt: true,
      title: true,
      titleEn: true,
      titleAr: true,
      displayTitle: true,
      publisher: true,
      source: { select: { name: true } },
    },
  });

  const urls = articles
    .map((article) => {
      const title =
        article.titleEn ||
        article.displayTitle ||
        article.titleAr ||
        article.title;
      const publication = (article.publisher || article.source.name)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const safeTitle = title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const loc = `${origin}/news/${article.id}`;
      const pubDate = article.publishedAt.toISOString();
      return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${publication}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${safeTitle}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
