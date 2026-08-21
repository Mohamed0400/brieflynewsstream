import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { describeQueryFailure } from "@/lib/api";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { getScheduleSnapshot, updateScheduledJob } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  return NextResponse.json(await getScheduleSnapshot());
}

export async function PATCH(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as {
    key?: string;
    cron?: string;
    enabled?: boolean;
  };
  if (!body.key) {
    return NextResponse.json(
      { error: "invalid_query", message: "key is required." },
      { status: 400 },
    );
  }
  try {
    await updateScheduledJob({
      key: body.key,
      cron: body.cron,
      enabled: body.enabled,
    });
    return NextResponse.json(await getScheduleSnapshot());
  } catch (error) {
    const failure = describeQueryFailure(error);
    return NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    );
  }
}
