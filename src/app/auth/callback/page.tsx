import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthCallbackClient } from "@/components/console/AuthCallbackClient";
import { BrandLoader } from "@/components/media/BrandLoader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirming account",
  robots: { index: false, follow: false },
};

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }

  if (params.get("code") || params.get("token_hash")) {
    redirect(`/auth/confirm?${params.toString()}`);
  }

  return (
    <Suspense
      fallback={(
        <main className="auth-callback">
          <BrandLoader size="md" />
          <p role="status">Confirming your account…</p>
        </main>
      )}
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
