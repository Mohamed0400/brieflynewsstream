import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { logAdminAction } from "@/lib/admin-audit";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { prisma } from "@/lib/prisma";
import { utcDayWindow } from "@/lib/plans";

const CONFIRM_PHRASE = "RESET QUOTA";

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({})) as {
    scope?: "account" | "all";
    accountId?: string;
    email?: string;
    confirmPhrase?: string;
    window?: "today" | "all";
  };

  const scope = body.scope === "all" ? "all" : "account";
  if (scope === "all" && body.confirmPhrase?.trim() !== CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        error: "confirm_required",
        message: `Type "${CONFIRM_PHRASE}" to confirm this action.`,
      },
      { status: 400 },
    );
  }

  if (scope === "account" && !body.accountId && !body.email?.trim()) {
    return NextResponse.json(
      { error: "invalid_query", message: "accountId or email is required." },
      { status: 400 },
    );
  }

  const windowMode = body.window === "all" ? "all" : "today";
  const { start, end } = utcDayWindow();

  let accountIds: string[] = [];
  if (scope === "all") {
    accountIds = (await prisma.account.findMany({ select: { id: true } })).map((row) => row.id);
  } else {
    const target = body.accountId
      ? await prisma.account.findUnique({ where: { id: body.accountId } })
      : await prisma.account.findFirst({
          where: { email: body.email!.trim().toLowerCase() },
        });
    if (!target) {
      return NextResponse.json(
        { error: "not_found", message: "Account not found." },
        { status: 404 },
      );
    }
    accountIds = [target.id];
  }

  const keys = await prisma.apiKey.findMany({
    where: { accountId: { in: accountIds } },
    select: { id: true },
  });
  const keyIds = keys.map((row) => row.id);
  if (!keyIds.length) {
    await logAdminAction({
      actorId: auth.account.id,
      action: scope === "all" ? "quota.reset_all" : "quota.reset_account",
      targetType: "account",
      targetId: scope === "all" ? "all" : accountIds[0]!,
      metadata: { scope, window: windowMode, deleted: 0, accountCount: accountIds.length },
    });
    return NextResponse.json({
      ok: true,
      deleted: 0,
      scope,
      window: windowMode,
      accountCount: accountIds.length,
      message: "No API keys found for the selected scope.",
    });
  }

  const deleted = await prisma.apiRequest.deleteMany({
    where: {
      apiKeyId: { in: keyIds },
      ...(windowMode === "today" ? { requestedAt: { gte: start, lt: end } } : {}),
    },
  });

  await logAdminAction({
    actorId: auth.account.id,
    action: scope === "all" ? "quota.reset_all" : "quota.reset_account",
    targetType: "account",
    targetId: scope === "all" ? "all" : accountIds[0]!,
    metadata: {
      scope,
      window: windowMode,
      deleted: deleted.count,
      accountCount: accountIds.length,
    },
  });

  return NextResponse.json({
    ok: true,
    deleted: deleted.count,
    scope,
    window: windowMode,
    accountCount: accountIds.length,
  });
}

export { CONFIRM_PHRASE as QUOTA_RESET_CONFIRM_PHRASE };
