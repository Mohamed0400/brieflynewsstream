import { AdminAuditPanel } from "@/components/console/AdminAuditPanel";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.opsKicker}</p>
        <h1>{copy.opsAudit.title}</h1>
        <p className="console-page-description">{copy.opsAudit.hint}</p>
      </header>
      <AdminAuditPanel />
    </div>
  );
}
