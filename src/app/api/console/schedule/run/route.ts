import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { getScheduleSnapshot, runScheduledJob } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({})) as { key?: string; force?: boolean };
  if (!body.key) {
    return NextResponse.json(
      { error: "invalid_query", message: "key is required." },
      { status: 400 },
    );
  }
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error: "use_github_actions",
        message: "This console runs on Vercel Hobby. Start collect or heal from GitHub Actions so it does not use Vercel CPU.",
      },
      { status: 409 },
    );
  }
  const result = await runScheduledJob(body.key, { force: body.force === true });
  const snapshot = await getScheduleSnapshot();
  return NextResponse.json(
    { ...snapshot, run: result },
    { status: result.ok || result.skipped ? 200 : 500 },
  );
}
