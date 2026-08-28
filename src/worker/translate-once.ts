import { prisma } from "../lib/prisma";
import { translatePendingArticles } from "../lib/article-translation";
import { limits } from "../lib/limits";

const allPending = process.argv.includes("--all");

async function main() {
  let totalTranslated = 0;
  let runs = 0;

  const maxRuns = allPending ? 100 : 1;
  do {
    const result = await translatePendingArticles(allPending ? { limit: 0 } : undefined);
    runs += 1;
    totalTranslated += result.translated;
    console.log(JSON.stringify({ run: runs, ...result, totalTranslated }, null, 2));
    if (!allPending || result.translated === 0 || result.pending === 0) break;
  } while (allPending && runs < maxRuns);

  const freshnessCutoff = new Date(
    Date.now() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000,
  );
  const remaining = await prisma.article.count({
    where: {
      publishedAt: { gte: freshnessCutoff },
      OR: [
        { translatedAt: null },
        { titleAr: null },
        { summaryAr: null },
        { titleEn: null },
        { summaryEn: null },
      ],
    },
  });
  if (remaining > 0) {
    console.log(`\n${remaining} article(s) still pending translation within the freshness window.`);
    if (!allPending) {
      console.log("Run npm run translate:live:all to finish the backfill, or use Console → Schedule → Translate articles → Run now.");
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
