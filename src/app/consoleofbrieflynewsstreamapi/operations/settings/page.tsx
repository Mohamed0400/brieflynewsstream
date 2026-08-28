import { AdminSettingsPanel } from "@/components/console/AdminSettingsPanel";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.opsKicker}</p>
        <h1>{copy.opsSettings.title}</h1>
        <p className="console-page-description">{copy.opsSettings.hint}</p>
      </header>
      <AdminSettingsPanel />
    </div>
  );
}
