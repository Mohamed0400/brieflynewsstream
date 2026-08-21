import { redirect } from "next/navigation";
import { AdminAuthShell } from "@/components/console/AdminAuthShell";
import { ConsoleLoginForm } from "@/components/console/ConsoleLoginForm";
import { getOrCreateAccount, getSessionUser, isSuperAdmin } from "@/lib/account";
import { ADMIN_OPERATIONS_PATH } from "@/lib/admin-app";
import { getConsoleLoginLang } from "@/lib/console-lang";
import { consoleLoginCopy } from "@/lib/console-translation";

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  if (user?.email) {
    const account = await getOrCreateAccount({
      authUserId: user.id,
      email: user.email,
    });
    if (isSuperAdmin(account)) redirect(ADMIN_OPERATIONS_PATH);
  }

  const lang = await getConsoleLoginLang(params.lang);
  const copy = consoleLoginCopy(lang);
  const denied = params.error === "denied" || (user?.email ? true : false);

  return (
    <AdminAuthShell copy={copy}>
      <ConsoleLoginForm
        copy={copy}
        variant="signin"
        audience="ops"
        initialError={denied ? copy.opsDenied : ""}
      />
    </AdminAuthShell>
  );
}
