import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/console/AdminShell";
import { ConsoleLangProvider } from "@/components/console/ConsoleLang";
import { getOrCreateAccount, getSessionUser, isSuperAdmin } from "@/lib/account";
import { ADMIN_APP_PATH } from "@/lib/admin-app";
import { getConsoleLang } from "@/lib/console-lang";
import { startEmbeddedScheduler } from "@/lib/scheduler";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminOperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user?.email) redirect(ADMIN_APP_PATH);
  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });
  if (!isSuperAdmin(account)) redirect(`${ADMIN_APP_PATH}?error=denied`);

  startEmbeddedScheduler("next");
  const lang = await getConsoleLang();
  return (
    <ConsoleLangProvider lang={lang}>
      <AdminShell
        environment={process.env.NEXT_PUBLIC_APP_ENV || "local"}
        lang={lang}
        accountEmail={account.email}
      >
        {children}
      </AdminShell>
    </ConsoleLangProvider>
  );
}
