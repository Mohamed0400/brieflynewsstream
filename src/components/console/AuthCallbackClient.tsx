"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/media/BrandLoader";
import { establishConsoleSessionClient } from "@/lib/account-client";
import { isBlockedAccountStatus } from "@/lib/console-signup-auth";
import { safeAppPath } from "@/lib/auth-redirect";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AUTH_TIMEOUT_MS, isAuthTimeoutError, withAuthTimeout } from "@/lib/supabase/auth-timeout";

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
        const { data } = await withAuthTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS.sessionRead,
        );
        if (!data.session) {
          throw new Error("This confirmation link is invalid or has expired.");
        }
        const payload = await establishConsoleSessionClient({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (isBlockedAccountStatus(payload.account.status)) {
          await supabase.auth.signOut();
          window.location.replace("/console/login?error=account_status");
          return;
        }
        if (!cancelled) router.replace(next);
      } catch (error) {
        if (isAuthTimeoutError(error)) {
          window.location.replace(
            `/auth/error?message=${encodeURIComponent("Unable to confirm this email link. Check the connection and try again.")}`,
          );
          return;
        }
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
