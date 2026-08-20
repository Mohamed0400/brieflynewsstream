import { PrismaClient } from "@prisma/client";
import { NATIONALITY_OPTIONS } from "../src/lib/nationalities";

const prisma = new PrismaClient();
const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

async function main() {
  const counts = await prisma.article.groupBy({
    by: ["country"],
    where: { publishedAt: { gte: since } },
    _count: { id: true },
  });
  const map = new Map(counts.map((row) => [row.country, row._count.id]));
  const report = NATIONALITY_OPTIONS.map((option) => ({
    code: option.code,
    country: option.country,
    last24h: map.get(option.code) ?? 0,
  }));
  console.log(JSON.stringify(report, null, 2));
}

main().finally(() => prisma.$disconnect());
