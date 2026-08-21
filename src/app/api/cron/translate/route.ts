import { handleCronJob } from "@/lib/cron-http";
import { JOB_TRANSLATE } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  return handleCronJob(request, JOB_TRANSLATE);
}

export async function POST(request: Request) {
  return handleCronJob(request, JOB_TRANSLATE);
}
