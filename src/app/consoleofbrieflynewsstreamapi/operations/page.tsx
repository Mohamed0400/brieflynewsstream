import { AdminOperations } from "@/components/console/AdminOperations";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.opsKicker}</p>
        <h1>{copy.opsHeading}</h1>
        <p className="console-page-description">{copy.opsDescription}</p>
      </header>
      <AdminOperations />
    </div>
  );
}
