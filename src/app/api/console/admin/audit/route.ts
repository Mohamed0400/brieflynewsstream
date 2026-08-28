import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { listAdminAuditLog } from "@/lib/admin-audit";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "50");
  const offset = Number(url.searchParams.get("offset") || "0");
  const action = url.searchParams.get("action") || undefined;

  const result = await listAdminAuditLog({ limit, offset, action });
  return NextResponse.json(result);
}
