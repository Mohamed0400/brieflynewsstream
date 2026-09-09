"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import type { AuthProvider } from "@/lib/auth-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AUTH_TIMEOUT_MS, isAuthTimeoutError, withAuthTimeout } from "@/lib/supabase/auth-timeout";
import { withConsoleLang, type ConsoleLoginCopy } from "@/lib/console-translation";
import { BrandLoader } from "@/components/media/BrandLoader";

type ResetPhase = "checking" | "ready" | "need-link";

export function ConsoleResetPasswordForm({
  copy,
  authProvider = "supabase",
}: {
  copy: ConsoleLoginCopy;
  authProvider?: AuthProvider;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const neonToken = searchParams.get("token")?.trim() || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ResetPhase>("checking");

  useEffect(() => {
    if (authProvider === "neon") {
      setPhase(neonToken ? "ready" : "need-link");
      return;
    }

    let cancelled = false;
    const supabase = createBrowserSupabaseClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setPhase("ready");
      }
    });

    void withAuthTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS.sessionRead)
      .then(({ data }) => {
        if (cancelled) return;
        setPhase(data.session ? "ready" : "need-link");
      })
      .catch((requestError) => {
        if (cancelled) return;
        if (isAuthTimeoutError(requestError)) setError(copy.networkError);
        setPhase("need-link");
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [authProvider, neonToken, copy.networkError]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(copy.resetTooShort);
      return;
    }
    if (password !== confirm) {
      setError(copy.resetMismatch);
      return;
    }
    setLoading(true);
    try {
      if (authProvider === "neon") {
        if (!neonToken) {
          setPhase("need-link");
          return;
        }
        const response = await withAuthTimeout(
          fetch("/api/console/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: neonToken, password }),
          }),
          AUTH_TIMEOUT_MS.passwordUpdate,
        );
        const payload = await response.json().catch(() => ({})) as { message?: string };
        if (!response.ok) {
          setError(payload.message || copy.authFailed);
          return;
        }
        router.push(withConsoleLang("/console/login", copy.lang));
        router.refresh();
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await withAuthTimeout(
        supabase.auth.updateUser({ password }),
        AUTH_TIMEOUT_MS.passwordUpdate,
      );
      if (updateError) {
        setError(updateError.message || copy.authFailed);
        return;
      }
      router.push("/console/overview");
      router.refresh();
    } catch (requestError) {
      setError(copy.networkError);
      toast.exception(requestError, copy.networkError);
    } finally {
      setLoading(false);
    }
  }

  if (phase === "checking") {
    return (
      <div className="console-gate-form console-gate-confirm" role="status">
        <BrandLoader size="sm" label={copy.resetChecking} showLabel />
      </div>
    );
  }

  if (phase === "need-link") {
    return (
      <div className="console-gate-form console-gate-confirm" role="status">
        <p className="console-gate-help">{copy.resetNeedLink}</p>
        {error ? (
          <p role="alert" className="console-gate-error">
            {error}
          </p>
        ) : null}
        <Link href={withConsoleLang("/console/login?forgot=1", copy.lang)} className="console-gate-link">
          {copy.forgotSubmit}
        </Link>
        <Link href={withConsoleLang("/console/login", copy.lang)} className="console-gate-link">
          {copy.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="console-gate-form">
      <div className="console-gate-field">
        <label htmlFor="new-password">{copy.passwordLabel}</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="console-gate-input"
          dir="ltr"
        />
      </div>
      <div className="console-gate-field">
        <label htmlFor="confirm-password">{copy.resetConfirmLabel}</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="console-gate-input"
          dir="ltr"
        />
      </div>
      {error && (
        <p role="alert" className="console-gate-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="console-gate-submit" aria-busy={loading}>
        {loading ? copy.submitting : copy.resetSubmit}
      </button>
      <p className="console-gate-switch">
        <Link href={withConsoleLang("/console/login", copy.lang)} className="console-gate-link">
          {copy.backToSignIn}
        </Link>
      </p>
    </form>
  );
}
