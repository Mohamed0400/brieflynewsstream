import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { logAdminAction } from "@/lib/admin-audit";
import { describeQueryFailure } from "@/lib/api";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { runOpsAutoHeal, runOpsRecovery, type OpsRecoverOptions } from "@/lib/ops-recovery";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as OpsRecoverOptions & {
    autoHeal?: boolean;
  };
  try {
    if (body.autoHeal) {
      const result = await runOpsAutoHeal({
        actorId: auth.account.id,
        forceEnabled: true,
        translate: true,
        triggerCollectIfStale: body.collect === true,
      });
      await logAdminAction({
        actorId: auth.account.id,
        action: "ops.auto_heal.manual",
        targetType: "pipeline",
        targetId: "ops-heal",
        metadata: result,
      }).catch(() => undefined);
      return NextResponse.json(result, {
        status: result.disabled ? 200 : 200,
      });
    }

    const result = await runOpsRecovery(body);
    await logAdminAction({
      actorId: auth.account.id,
      action: "ops.recover",
      targetType: "pipeline",
      targetId: "recover",
      metadata: {
        plan: body,
        messages: result.messages,
        remaining: result.remaining,
        abandonedRaw: result.abandonedRaw,
        collect: result.collect,
      },
    }).catch(() => undefined);
    const status = result.remaining.stuckJobs.length > 0
      || result.remaining.pendingRawArticles > 0
      || result.remaining.pendingTranslationArticles > 0
      ? 207
      : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    const failure = describeQueryFailure(error);
    return NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    );
  }
}
