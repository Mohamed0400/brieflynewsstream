import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SchedulePanel } from "@/components/console/SchedulePanel";
import { getOrCreateAccount, getSessionUser, isSuperAdmin } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { getScheduleSnapshot } from "@/lib/scheduler";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.schedule.title };
}

export const dynamic = "force-dynamic";

export default async function ConsoleSchedulePage() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");
  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });
  if (!isSuperAdmin(account)) redirect("/console/overview");

  const copy = consoleDashboardCopy(await getConsoleLang());
  const snapshot = await getScheduleSnapshot();
  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.schedule.kicker}</p>
        <h1>{copy.schedule.heading}</h1>
        <p className="console-page-description">
          {copy.schedule.description}
        </p>
      </header>
      <SchedulePanel initial={snapshot} />
    </div>
  );
}
