import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { ConsoleLangProvider } from "@/components/console/ConsoleLang";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { accountDisplayName } from "@/lib/console-display-name";
import { getConsoleLang } from "@/lib/console-lang";
import { getMaintenanceStatus } from "@/lib/maintenance";
import { startEmbeddedScheduler } from "@/lib/scheduler";
import "../../console-shell.css";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#f7f9fc",
};

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
  const maintenance = await getMaintenanceStatus();
  return (
    <ConsoleLangProvider lang={lang}>
      <ConsoleShell
        lang={lang}
        accountEmail={account.email}
        accountDisplayName={accountDisplayName(account.email, user.user_metadata)}
        accountPlan={account.plan}
        maintenance={maintenance}
      >
        {children}
      </ConsoleShell>
    </ConsoleLangProvider>
  );
}
