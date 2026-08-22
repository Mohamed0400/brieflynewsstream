import { prisma } from "../src/lib/prisma";

async function main() {
  const [sourceCount, enabledCount, latest, jobs, incompleteAr] = await Promise.all([
    prisma.source.count(),
    prisma.source.count({ where: { enabled: true } }),
    prisma.article.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true, title: true, titleAr: true },
    }),
    prisma.scheduledJob.findMany({
      select: { key: true, enabled: true, lastRunAt: true, lastStatus: true, cron: true },
    }),
    prisma.article.count({
      where: {
        publishedAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
        OR: [{ titleAr: null }, { titleAr: "" }],
      },
    }),
  ]);
  console.log(JSON.stringify({ sourceCount, enabledCount, latest, jobs, freshMissingArabic: incompleteAr }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
