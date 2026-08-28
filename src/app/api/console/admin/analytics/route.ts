import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { prisma } from "@/lib/prisma";

function topByCount<T extends { _count: number }>(rows: T[], limit?: number) {
  const sorted = [...rows].sort((a, b) => b._count - a._count);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") || "7")));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [channels, utmSources, utmMediums, topPaths, dailyViews, signupChannels, pageViewTotal] = await Promise.all([
    prisma.pageView.groupBy({
      by: ["channel"],
      where: { viewedAt: { gte: since } },
      _count: true,
    }).catch(() => []),
    prisma.pageView.groupBy({
      by: ["utmSource"],
      where: { viewedAt: { gte: since }, utmSource: { not: "" } },
      _count: true,
    }).catch(() => []),
    prisma.pageView.groupBy({
      by: ["utmMedium"],
      where: { viewedAt: { gte: since }, utmMedium: { not: "" } },
      _count: true,
    }).catch(() => []),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { viewedAt: { gte: since } },
      _count: true,
    }).catch(() => []),
    prisma.$queryRaw<Array<{ day: Date; views: bigint }>>`
      SELECT date_trunc('day', "viewedAt") AS day, count(*)::bigint AS views
      FROM "PageView"
      WHERE "viewedAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `.catch(() => []),
    prisma.account.groupBy({
      by: ["trafficChannel"],
      where: { createdAt: { gte: since } },
      _count: true,
    }).catch(() => []),
    prisma.pageView.count({ where: { viewedAt: { gte: since } } }).catch(() => 0),
  ]);

  const sortedChannels = topByCount(channels);
  const sortedUtmSources = topByCount(utmSources, 20);
  const sortedUtmMediums = topByCount(utmMediums, 20);
  const sortedTopPaths = topByCount(topPaths, 15);
  const sortedSignupChannels = topByCount(signupChannels);

  return NextResponse.json({
    days,
    since: since.toISOString(),
    pageViews: {
      total: pageViewTotal,
      channels: sortedChannels.map((row) => ({ channel: row.channel || "direct", views: row._count })),
      utmSources: sortedUtmSources.map((row) => ({ source: row.utmSource, views: row._count })),
      utmMediums: sortedUtmMediums.map((row) => ({ medium: row.utmMedium, views: row._count })),
      topPaths: sortedTopPaths.map((row) => ({ path: row.path, views: row._count })),
      daily: dailyViews.map((row) => ({
        day: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day),
        views: Number(row.views),
      })),
    },
    signups: {
      byChannel: sortedSignupChannels.map((row) => ({
        channel: row.trafficChannel || "direct",
        count: row._count,
      })),
    },
  });
}
