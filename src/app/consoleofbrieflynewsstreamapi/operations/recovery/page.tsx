import { OpsRecoveryPanel } from "@/components/console/OpsRecoveryPanel";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export const dynamic = "force-dynamic";

export default async function AdminRecoveryPage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.opsRecovery.kicker}</p>
        <h1>{copy.opsRecovery.title}</h1>
        <p className="console-page-description">{copy.opsRecovery.description}</p>
      </header>
      <OpsRecoveryPanel />
    </div>
  );
}
