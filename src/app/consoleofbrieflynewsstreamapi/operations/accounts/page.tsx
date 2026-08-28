import { AdminOperations } from "@/components/console/AdminOperations";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.opsKicker}</p>
        <h1>{copy.customers.title}</h1>
        <p className="console-page-description">{copy.customers.hint}</p>
      </header>
      <AdminOperations />
    </div>
  );
}
