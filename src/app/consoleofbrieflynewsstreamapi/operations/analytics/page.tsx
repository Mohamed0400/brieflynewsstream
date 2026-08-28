import { AdminAnalyticsPanel } from "@/components/console/AdminAnalyticsPanel";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.opsKicker}</p>
        <h1>{copy.opsAnalytics.title}</h1>
        <p className="console-page-description">{copy.opsAnalytics.hint}</p>
      </header>
      <AdminAnalyticsPanel />
    </div>
  );
}
