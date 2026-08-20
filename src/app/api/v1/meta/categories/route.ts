import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth";
import { apiMeta, jsonApi } from "@/lib/api-response";
import { CATEGORY_META } from "@/lib/market";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const denied = await requireApiKey(request);
  if (denied) return denied;

  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar";
  return jsonApi({
    meta: apiMeta({ lang }),
    items: CATEGORY_META.map(({ code, label, labelAr }) => ({
      code,
      label: lang === "ar" ? labelAr : label,
      labelEn: label,
      labelAr,
    })),
  }, undefined, origin, request);
}
