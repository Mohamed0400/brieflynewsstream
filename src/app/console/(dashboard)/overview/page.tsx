import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { limits } from "@/lib/limits";
import { kuwaitDate } from "@/lib/market";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.overview.title };
}

export const dynamic = "force-dynamic";

export default async function ConsoleOverviewPage() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");
  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  const lang = await getConsoleLang();
  const copy = consoleDashboardCopy(lang);
  const today = kuwaitDate();
  const todayStart = new Date(`${today}T00:00:00+03:00`);
  const requestedAt = new Date().getTime();
  const sevenDaysAgo = new Date(requestedAt - 7 * 24 * 60 * 60 * 1000);
  const accountKeyIds = (
    await prisma.apiKey.findMany({
      where: { accountId: account.id },
      select: { id: true },
    })
  ).map((key) => key.id);

  const [requestsToday, activeKeys, recentRequests] = await Promise.all([
    accountKeyIds.length
      ? prisma.apiRequest.count({
          where: {
            requestedAt: { gte: todayStart },
            apiKeyId: { in: accountKeyIds },
          },
        })
      : Promise.resolve(0),
    prisma.apiKey.count({ where: { accountId: account.id, revokedAt: null } }),
    accountKeyIds.length
      ? prisma.apiRequest.findMany({
          where: {
            requestedAt: { gte: sevenDaysAgo },
            apiKeyId: { in: accountKeyIds },
          },
          select: { endpoint: true, requestedAt: true, pointsUsed: true },
          orderBy: { requestedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(requestedAt - (6 - index) * 24 * 60 * 60 * 1000);
    return {
      key: kuwaitDate(date),
      label: new Intl.DateTimeFormat(copy.locale, {
        weekday: "short",
        timeZone: process.env.APP_TIMEZONE || "Asia/Kuwait",
      }).format(date),
      count: 0,
    };
  });
  const dayMap = new Map(days.map((day) => [day.key, day]));
  const endpointCounts = new Map<string, number>();
  for (const request of recentRequests) {
    const day = dayMap.get(kuwaitDate(request.requestedAt));
    if (day) day.count += 1;
    endpointCounts.set(request.endpoint, (endpointCounts.get(request.endpoint) ?? 0) + 1);
  }
  const maxDaily = Math.max(1, ...days.map((day) => day.count));
  const endpoints = [...endpointCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const numberLocale = copy.locale;

  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.overview.kicker}</p>
        <h1>{copy.overview.heading}</h1>
        <p className="console-page-description">
          {copy.overview.description}
        </p>
      </header>

      <section className="console-metric-grid" aria-label={copy.overview.metricsAria}>
        <article className="console-metric console-metric-primary">
          <span>{copy.overview.requestsToday}</span>
          <strong>{requestsToday.toLocaleString(numberLocale)}</strong>
          <small>{copy.overview.requestsHint}</small>
        </article>
        <article className="console-metric">
          <span>{copy.overview.activeKeys}</span>
          <strong>{activeKeys.toLocaleString(numberLocale)}</strong>
          <small>{copy.overview.activeKeysHint}</small>
        </article>
        <article className="console-metric">
          <span>{copy.overview.accessPolicy}</span>
          <strong className="console-word-metric">{copy.overview.accessValue}</strong>
          <small>{copy.overview.accessHint}</small>
        </article>
        <article className="console-metric">
          <span>{copy.overview.freshness}</span>
          <strong>{Math.max(1, limits.nationalityMaxAgeHours)}h</strong>
          <small>{copy.overview.freshnessHint}</small>
        </article>
      </section>

      <div className="console-overview-grid">
        <section className="console-panel console-activity-panel" aria-labelledby="activity-heading">
          <div className="console-panel-heading">
            <div>
              <h2 id="activity-heading">{copy.overview.activity}</h2>
              <p>{copy.overview.activityHint}</p>
            </div>
            <strong>{copy.overview.activityTotal(recentRequests.length.toLocaleString(numberLocale))}</strong>
          </div>
          {recentRequests.length ? (
            <div
              className="console-bar-chart"
              role="img"
              aria-label={copy.overview.activityChart(days.map((day) => `${day.label}: ${day.count}`).join(", "))}
            >
              {days.map((day) => (
                <div key={day.key} className="console-bar-column">
                  <span className="console-bar-value">{day.count}</span>
                  <div className="console-bar-track">
                    <span
                      className="console-bar"
                      style={{
                        "--bar-height": day.count
                          ? `${Math.max(4, (day.count / maxDaily) * 100)}%`
                          : "0%",
                      } as CSSProperties}
                    />
                  </div>
                  <span className="console-bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="console-empty-state">
              <strong>{copy.overview.emptyActivity}</strong>
              <p>{copy.overview.emptyActivityHint}</p>
            </div>
          )}
        </section>

        <section className="console-panel" aria-labelledby="endpoint-heading">
          <div className="console-panel-heading">
            <div>
              <h2 id="endpoint-heading">{copy.overview.endpoints}</h2>
              <p>{copy.overview.endpointsHint}</p>
            </div>
          </div>
          {endpoints.length ? (
            <div className="console-endpoint-list">
              {endpoints.map(([endpoint, count]) => (
                <div key={endpoint} className="console-endpoint-row">
                  <code>{endpoint}</code>
                  <span>{count.toLocaleString(numberLocale)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="console-empty-state console-empty-state-compact">
              <strong>{copy.overview.emptyEndpoints}</strong>
              <p>{copy.overview.emptyEndpointsHint}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
