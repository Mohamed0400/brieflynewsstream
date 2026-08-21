import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import {
  PLATFORM_OVERVIEW_FILENAME,
  buildPlatformOverviewPdf,
} from "@/lib/console/platform-overview-pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;

  const pdf = buildPlatformOverviewPdf();
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${PLATFORM_OVERVIEW_FILENAME}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
