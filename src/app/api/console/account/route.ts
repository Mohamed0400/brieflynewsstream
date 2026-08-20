import { NextResponse } from "next/server";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  return NextResponse.json({
    account: {
      id: account.id,
      email: account.email,
      plan: account.plan,
      role: account.role,
      status: account.status,
    },
  });
}

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  return NextResponse.json({
    account: {
      id: account.id,
      email: account.email,
      plan: account.plan,
      role: account.role,
      status: account.status,
    },
  });
}
