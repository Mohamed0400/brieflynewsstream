import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { getOpsStatus } from "@/lib/ops-recovery";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  return NextResponse.json(await getOpsStatus());
}
