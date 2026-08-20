import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const existing = await prisma.apiKey.findFirst({
    where: { id, accountId: auth.account.id },
    select: { id: true, revokedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!existing.revokedAt) {
    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
