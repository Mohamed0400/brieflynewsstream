import { prisma } from "../src/lib/prisma";

async function main() {
  const [total, enabled, byCategory] = await Promise.all([
    prisma.source.count(),
    prisma.source.count({ where: { enabled: true } }),
    prisma.source.groupBy({ by: ["defaultCategory"], _count: true }),
  ]);
  console.log(JSON.stringify({
    total,
    enabled,
    categories: byCategory.map((row) => ({
      category: row.defaultCategory,
      count: row._count,
    })),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
