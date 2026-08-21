import { handleCronJob } from "@/lib/cron-http";
import { JOB_COLLECT } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Console / admin alias for POST /api/cron/collect */
export async function GET(request: Request) {
  return handleCronJob(request, JOB_COLLECT);
}

export async function POST(request: Request) {
  return handleCronJob(request, JOB_COLLECT);
}
