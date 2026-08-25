import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function withPoolParams(url: string | undefined) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const limit = process.env.PRISMA_CONNECTION_LIMIT;
    if (limit && !parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", limit);
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", process.env.PRISMA_POOL_TIMEOUT || "30");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const datasourceUrl = withPoolParams(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
