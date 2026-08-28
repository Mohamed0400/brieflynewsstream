import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { describeQueryFailure } from "@/lib/api";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { runOpsRecovery, type OpsRecoverOptions } from "@/lib/ops-recovery";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as OpsRecoverOptions;
  try {
    const result = await runOpsRecovery(body);
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
