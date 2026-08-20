import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiKeysPanel } from "@/components/console/ApiKeysPanel";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.keys.title };
}

export const dynamic = "force-dynamic";

export default async function ConsoleKeysPage() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");
  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  const copy = consoleDashboardCopy(await getConsoleLang());
  const keys = await prisma.apiKey.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastFour: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.keys.kicker}</p>
        <h1>{copy.keys.heading}</h1>
        <p className="console-page-description">
          {copy.keys.description}
        </p>
      </header>
      <ApiKeysPanel
        initialKeys={keys.map((key) => ({
          ...key,
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
          revokedAt: key.revokedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
