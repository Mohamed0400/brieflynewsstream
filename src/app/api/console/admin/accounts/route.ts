import { NextResponse } from "next/server";
import type { AccountStatus, PlanTier } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { prisma } from "@/lib/prisma";

const plans = new Set<PlanTier>(["FREE", "PRO", "ENTERPRISE"]);
const statuses = new Set<AccountStatus>(["ACTIVE", "SUSPENDED", "CLOSED"]);

export async function PATCH(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({})) as {
    accountId?: string;
    email?: string;
    plan?: PlanTier;
    status?: AccountStatus;
    dailyPointsOverride?: number | null;
    maxKeysOverride?: number | null;
  };

  if (!body.accountId && !body.email) {
    return NextResponse.json(
      { error: "invalid_request", message: "Provide accountId or email." },
      { status: 400 },
    );
  }

  const target = body.accountId
    ? await prisma.account.findUnique({ where: { id: body.accountId } })
    : await prisma.account.findFirst({
        where: { email: body.email!.trim().toLowerCase() },
      });

  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (body.plan && !plans.has(body.plan)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  if (body.status && !statuses.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const updated = await prisma.account.update({
    where: { id: target.id },
    data: {
      ...(body.plan ? { plan: body.plan } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.dailyPointsOverride !== undefined
        ? { dailyPointsOverride: body.dailyPointsOverride }
        : {}),
      ...(body.maxKeysOverride !== undefined
        ? { maxKeysOverride: body.maxKeysOverride }
        : {}),
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: auth.account.id,
      action: "account.plan_update",
      targetType: "account",
      targetId: updated.id,
      metadata: {
        plan: updated.plan,
        status: updated.status,
        dailyPointsOverride: updated.dailyPointsOverride,
        maxKeysOverride: updated.maxKeysOverride,
      },
    },
  });

  return NextResponse.json({
    item: {
      id: updated.id,
      email: updated.email,
      plan: updated.plan,
      status: updated.status,
      dailyPointsOverride: updated.dailyPointsOverride,
      maxKeysOverride: updated.maxKeysOverride,
    },
  });
}
