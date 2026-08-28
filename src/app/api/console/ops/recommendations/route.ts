import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { describeQueryFailure } from "@/lib/api";
import { getOpsRecommendations } from "@/lib/ops-recovery";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;
  try {
    const payload = await getOpsRecommendations();
    return NextResponse.json(payload);
  } catch (error) {
    const failure = describeQueryFailure(error);
    return NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    );
  }
}
