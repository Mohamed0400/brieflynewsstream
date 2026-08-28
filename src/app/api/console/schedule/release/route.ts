import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { getScheduleSnapshot, releaseJobLock } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as { key?: string };
  if (!body.key) {
    return NextResponse.json(
      { error: "invalid_query", message: "key is required." },
      { status: 400 },
    );
  }
  await releaseJobLock(body.key);
  const snapshot = await getScheduleSnapshot();
  return NextResponse.json({
    ...snapshot,
    released: body.key,
  });
}
