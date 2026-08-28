import type { Metadata } from "next";
import Link from "next/link";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { accountDisplayName } from "@/lib/console-display-name";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { resolvePlanLimits } from "@/lib/plans";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getConsoleLang();
  const copy = consoleDashboardCopy(lang);
  return { title: copy.settings.title };
}

export default async function ConsoleSettingsPage() {
  const lang = await getConsoleLang();
  const copy = consoleDashboardCopy(lang);
  const user = await getSessionUser();
  if (!user?.email) return null;

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });
  const limits = resolvePlanLimits({
    plan: account.plan,
    dailyPointsOverride: account.dailyPointsOverride,
    maxKeysOverride: account.maxKeysOverride,
  });
  const displayName = accountDisplayName(account.email, user.user_metadata);
  const planLabel =
    account.plan === "PRO" ? "Pro"
    : account.plan === "ENTERPRISE" ? "Enterprise"
    : copy.workspacePlan;

  return (
    <div className="console-page">
      <header className="console-page-header">
        <h1>{copy.settings.heading}</h1>
        <p className="console-page-description">{copy.settings.description}</p>
      </header>

      <section className="console-panel console-settings-panel" aria-label={copy.settings.accountAria}>
        <div className="console-settings-rows">
          <div className="console-settings-row">
            <span>{copy.settings.nameLabel}</span>
            <strong>{displayName}</strong>
          </div>
          <div className="console-settings-row">
            <span>{copy.settings.emailLabel}</span>
            <strong dir="ltr">{account.email}</strong>
          </div>
          <div className="console-settings-row">
            <span>{copy.settings.planLabel}</span>
            <strong>{planLabel}</strong>
          </div>
          <div className="console-settings-row">
            <span>{copy.settings.dailyLimitLabel}</span>
            <strong>{limits.dailyRequests.toLocaleString(lang === "ar" ? "ar" : "en-US")}</strong>
          </div>
        </div>
        <div className="console-inline-actions">
          <Link href="/console/billing" className="console-primary-button">
            {copy.managePlan}
          </Link>
          <Link href="/console/keys" className="console-secondary-button">
            {copy.nav.keys}
          </Link>
        </div>
      </section>
    </div>
  );
}
