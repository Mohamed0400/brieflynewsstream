import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConsoleWelcomeBanner } from "@/components/console/ConsoleWelcomeBanner";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { CATEGORY_META } from "@/lib/market";
import { resolvePlanLimits, utcDayWindow } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { marketingRegionPins } from "@/lib/region-coverage";

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
  const numberLocale = copy.locale;
  const planLabel =
    account.plan === "PRO" ? "Pro"
    : account.plan === "ENTERPRISE" ? "Enterprise"
    : copy.workspacePlan;
  const limits = resolvePlanLimits({
    plan: account.plan,
    dailyPointsOverride: account.dailyPointsOverride,
    maxKeysOverride: account.maxKeysOverride,
  });
  const { start, end } = utcDayWindow();
  const [usedToday, activeKeys] = await Promise.all([
    prisma.apiRequest.count({
      where: {
        apiKey: { accountId: account.id },
        requestedAt: { gte: start, lt: end },
      },
    }),
    prisma.apiKey.count({
      where: { accountId: account.id, revokedAt: null },
    }),
  ]);
  const regions = marketingRegionPins();

  return (
    <div className="console-page">
      <ConsoleWelcomeBanner email={account.email} planLabel={planLabel} />

      <section className="console-plan-bar" aria-label={copy.overview.planAria}>
        <div className="console-plan-bar-copy">
          <span>{copy.overview.planLabel}</span>
          <strong>{planLabel}</strong>
          <small>
            {copy.overview.usageLine(
              usedToday.toLocaleString(numberLocale),
              limits.dailyRequests.toLocaleString(numberLocale),
            )}
            {" · "}
            {copy.overview.keysLine(
              activeKeys.toLocaleString(numberLocale),
              limits.maxKeys.toLocaleString(numberLocale),
            )}
          </small>
        </div>
        {account.plan === "FREE" ? (
          <Link href="/console/billing" className="console-primary-button">
            {copy.overview.upgradeCta}
          </Link>
        ) : (
          <Link href="/console/billing" className="console-secondary-button">
            {copy.nav.billing}
          </Link>
        )}
      </section>

      <section className="console-metric-grid" aria-label={copy.overview.metricsAria}>
        <article className="console-metric console-metric-primary">
          <span>{copy.overview.countries}</span>
          <strong>{COUNTRY_CATALOG.length.toLocaleString(numberLocale)}</strong>
          <small>{copy.overview.countriesHint}</small>
        </article>
        <article className="console-metric">
          <span>{copy.overview.languages}</span>
          <strong className="console-word-metric">{copy.overview.languagesValue}</strong>
          <small>{copy.overview.languagesHint}</small>
        </article>
        <article className="console-metric">
          <span>{copy.overview.categories}</span>
          <strong>{CATEGORY_META.length.toLocaleString(numberLocale)}</strong>
          <small>{copy.overview.categoriesHint}</small>
        </article>
        <article className="console-metric">
          <span>{copy.overview.regions}</span>
          <strong>{regions.length.toLocaleString(numberLocale)}</strong>
          <small>{copy.overview.regionsHint}</small>
        </article>
      </section>

      <div className="console-overview-grid">
        <section className="console-panel" aria-labelledby="coverage-heading">
          <div className="console-panel-heading">
            <div>
              <h2 id="coverage-heading">{copy.overview.coverageTitle}</h2>
              <p>{copy.overview.coverageHint}</p>
            </div>
          </div>
          <div className="console-coverage-list">
            {regions.map((region) => (
              <div key={region.code} className="console-coverage-row">
                <strong>{lang === "ar" ? region.labelAr : region.label}</strong>
                <span>{region.count.toLocaleString(numberLocale)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="console-panel" aria-labelledby="start-heading">
          <div className="console-panel-heading">
            <div>
              <h2 id="start-heading">{copy.overview.startTitle}</h2>
              <p>{copy.overview.startHint}</p>
            </div>
          </div>
          <div className="console-inline-actions">
            <Link href="/console/keys" className="console-secondary-button">
              {copy.nav.keys}
            </Link>
            <Link href="/console/explorer" className="console-secondary-button">
              {copy.nav.explorer}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
