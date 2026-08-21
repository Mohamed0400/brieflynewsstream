import { handleCronJob } from "@/lib/cron-http";
import { JOB_PUBLISH } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  return handleCronJob(request, JOB_PUBLISH);
}

export async function POST(request: Request) {
  return handleCronJob(request, JOB_PUBLISH);
}
