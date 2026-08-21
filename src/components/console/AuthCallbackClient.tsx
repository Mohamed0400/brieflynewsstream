"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/media/BrandLoader";
import { getOrCreateAccountClient } from "@/lib/account-client";
import { safeAppPath } from "@/lib/auth-redirect";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const next = safeAppPath(
        params.get("next"),
        params.get("type") === "recovery" ? "/console/reset-password" : "/console/overview",
      );
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const errorDescription = params.get("error_description") || params.get("error");

      if (errorDescription) {
        window.location.replace(`/auth/error?message=${encodeURIComponent(errorDescription.replace(/\+/g, " "))}`);
        return;
      }

      // PKCE `code` and email `token_hash` must be exchanged on the server,
      // where @supabase/ssr can read the verifier cookie.
      if (code || tokenHash) {
        const confirm = new URL("/auth/confirm", window.location.origin);
        params.forEach((value, key) => confirm.searchParams.set(key, value));
        window.location.replace(`${confirm.pathname}${confirm.search}`);
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error("This confirmation link is invalid or has expired.");
        }
        await getOrCreateAccountClient();
        if (!cancelled) router.replace(next);
      } catch (error) {
        const text = error instanceof Error ? error.message : "Could not confirm this email link.";
        window.location.replace(`/auth/error?message=${encodeURIComponent(text)}`);
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <main className="auth-callback" lang="en">
      <BrandLoader size="md" />
      <p role="status">{message}</p>
    </main>
  );
}
