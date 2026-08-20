import { redirect } from "next/navigation";
import { ConsoleLangProvider } from "@/components/console/ConsoleLang";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { startEmbeddedScheduler } from "@/lib/scheduler";

export default async function ConsoleDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  if (account.status === "SUSPENDED" || account.status === "CLOSED") {
    redirect("/console/login?error=account_status");
  }

  startEmbeddedScheduler("next");
  const lang = await getConsoleLang();
  return (
    <ConsoleLangProvider lang={lang}>
      <ConsoleShell
        environment={process.env.NEXT_PUBLIC_APP_ENV || "local"}
        lang={lang}
        accountEmail={account.email}
        accountPlan={account.plan}
        accountRole={account.role}
      >
        {children}
      </ConsoleShell>
    </ConsoleLangProvider>
  );
}
