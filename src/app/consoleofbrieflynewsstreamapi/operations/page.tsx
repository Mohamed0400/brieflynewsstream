import { AdminOverviewPanel } from "@/components/console/AdminOverviewPanel";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.opsOverview.kicker}</p>
        <h1>{copy.opsOverview.title}</h1>
        <p className="console-page-description">{copy.opsOverview.description}</p>
      </header>
      <AdminOverviewPanel />
    </div>
  );
}
