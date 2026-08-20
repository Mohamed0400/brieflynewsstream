"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ConsoleLoginCopy } from "@/lib/console-translation";

export function ConsoleResetPasswordForm({ copy }: { copy: ConsoleLoginCopy }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, []);

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
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message || copy.authFailed);
      return;
    }
    router.push("/console/overview");
    router.refresh();
  }

  if (!ready) {
    return <p className="console-gate-help">{copy.resetNeedLink}</p>;
  }

  return (
    <form onSubmit={submit} className="console-gate-form">
      <h2 className="console-gate-form-title">{copy.resetTitle}</h2>
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
    </form>
  );
}
