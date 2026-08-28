import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { fetchAdminOverview } from "@/lib/admin-overview";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const overview = await fetchAdminOverview();
  return NextResponse.json(overview);
}
