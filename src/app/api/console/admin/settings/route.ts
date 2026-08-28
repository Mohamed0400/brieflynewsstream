import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { logAdminAction } from "@/lib/admin-audit";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { DEFAULT_OPS_SETTINGS, getOpsSettings } from "@/lib/ops-settings";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const settings = await getOpsSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const allowedKeys = new Set(Object.keys(DEFAULT_OPS_SETTINGS));
  const updates = Object.entries(body).filter(([key]) => allowedKeys.has(key));
  if (!updates.length) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  for (const [key, value] of updates) {
    await prisma.opsSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue, updatedBy: auth.account.id },
      update: { value: value as Prisma.InputJsonValue, updatedBy: auth.account.id },
    });
  }

  await logAdminAction({
    actorId: auth.account.id,
    action: "settings.update",
    targetType: "ops_setting",
    targetId: "global",
    metadata: Object.fromEntries(updates),
  });

  const settings = await getOpsSettings();
  return NextResponse.json({ settings });
}
