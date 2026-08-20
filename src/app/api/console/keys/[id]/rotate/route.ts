import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { rotateApiKey } from "@/lib/auth";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const owned = await prisma.apiKey.findFirst({
    where: { id, accountId: auth.account.id },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = await rotateApiKey(id);
  if ("error" in result) {
    return NextResponse.json(
      {
        error: result.error,
        message: result.error === "revoked"
          ? "A revoked key cannot be rotated. Create a new key instead."
          : "That API key was not found.",
      },
      { status: result.error === "revoked" ? 409 : 404 },
    );
  }

  return NextResponse.json({
    key: result.plaintext,
    item: {
      id: result.record.id,
      name: result.record.name,
      prefix: result.record.prefix,
      lastFour: result.record.lastFour,
      createdAt: result.record.createdAt.toISOString(),
      lastUsedAt: null,
      revokedAt: result.record.revokedAt?.toISOString() ?? null,
    },
  });
}
