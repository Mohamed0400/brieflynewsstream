import { NextResponse } from "next/server";
import { requireAdminKey, secureMatches } from "./auth";
import { runScheduledJob } from "./scheduler";

export function authorizeCron(request: Request) {
  const expected = process.env.CRON_SECRET || process.env.ADMIN_API_KEY;
  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (secureMatches(bearer, expected)) return null;
  if (!requireAdminKey(request)) return null;
  return NextResponse.json(
    { error: "unauthorized", message: "Provide CRON_SECRET as Bearer or ADMIN_API_KEY in X-API-Key." },
    { status: 401 },
  );
}

export async function handleCronJob(request: Request, key: string) {
  const denied = authorizeCron(request);
  if (denied) return denied;
  const result = await runScheduledJob(key);
  return NextResponse.json(
    { ok: result.ok, skipped: result.skipped, message: result.message, job: key },
    { status: result.ok || result.skipped ? 200 : 500 },
  );
}
