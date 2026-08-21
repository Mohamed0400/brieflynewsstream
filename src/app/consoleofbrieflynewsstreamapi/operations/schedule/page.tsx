import { SchedulePanel } from "@/components/console/SchedulePanel";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { getScheduleSnapshot } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const copy = consoleDashboardCopy(await getConsoleLang());
  const snapshot = await getScheduleSnapshot();
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.schedule.kicker}</p>
        <h1>{copy.schedule.heading}</h1>
        <p className="console-page-description">{copy.schedule.description}</p>
      </header>
      <SchedulePanel initial={snapshot} />
    </div>
  );
}
