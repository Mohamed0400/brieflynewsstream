import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildAttributionPayload, parseAttributionCookie, SESSION_COOKIE } from "@/lib/attribution";
import { getPublicSiteSettings } from "@/lib/ops-settings";
import { prisma } from "@/lib/prisma";

function sessionIdFromRequest(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (match?.[1]) return match[1].slice(0, 64);
  return createHash("sha256").update(`${request.headers.get("x-forwarded-for") || "anon"}-${Date.now()}`).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  const siteSettings = await getPublicSiteSettings();
  if (!siteSettings.pageViewTracking) {
    return NextResponse.json({ ok: true, skipped: true, reason: "disabled" });
  }

  const body = await request.json().catch(() => ({})) as {
    path?: string;
    locale?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };

  const path = (body.path || "/").slice(0, 300);
  if (!path.startsWith("/") || path.startsWith("//")) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }
  if (path.startsWith("/consoleofbrieflynewsstreamapi") || path.startsWith("/api/")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const attrMatch = cookieHeader.match(/bns_attribution=([^;]+)/);
  const cookieAttr = parseAttributionCookie(attrMatch?.[1] ? decodeURIComponent(attrMatch[1]) : null);

  const payload = buildAttributionPayload({
    utmSource: body.utmSource || cookieAttr?.utmSource,
    utmMedium: body.utmMedium || cookieAttr?.utmMedium,
    utmCampaign: body.utmCampaign || cookieAttr?.utmCampaign,
    utmContent: body.utmContent || cookieAttr?.utmContent,
    utmTerm: body.utmTerm || cookieAttr?.utmTerm,
    referrer: body.referrer || cookieAttr?.referrer || request.headers.get("referer") || "",
    landingPath: cookieAttr?.landingPath || path,
  });

  const sessionId = sessionIdFromRequest(request);

  try {
    await prisma.pageView.create({
      data: {
        id: randomUUID(),
        path,
        locale: (body.locale || "").slice(0, 12),
        referrer: payload.referrer,
        utmSource: payload.utmSource,
        utmMedium: payload.utmMedium,
        utmCampaign: payload.utmCampaign,
        utmContent: payload.utmContent,
        utmTerm: payload.utmTerm,
        channel: payload.channel,
        sessionId,
      },
    });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }

  const response = NextResponse.json({ ok: true, stored: true });
  if (!cookieHeader.includes(`${SESSION_COOKIE}=`)) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}
