import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { describeQueryFailure } from "@/lib/api";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { getOpsStatus, releaseStuckJobLocks } from "@/lib/ops-recovery";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as { keys?: string[]; force?: boolean };
  try {
    const released = await releaseStuckJobLocks({
      keys: body.keys,
      force: body.force === true,
    });
    const status = await getOpsStatus();
    return NextResponse.json({
      released,
      status,
      messages: released.length
        ? [`Released ${released.length} job lock(s): ${released.join(", ")}.`]
        : ["No running job locks matched the release request."],
    });
  } catch (error) {
    const failure = describeQueryFailure(error);
    return NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    );
  }
}
