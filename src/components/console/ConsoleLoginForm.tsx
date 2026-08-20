"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { persistConsoleLang, type ConsoleLoginCopy } from "@/lib/console-translation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOrCreateAccountClient } from "@/lib/account-client";

type Mode = "signin" | "signup" | "otp" | "forgot";

export function ConsoleLoginForm({ copy }: { copy: ConsoleLoginCopy }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    persistConsoleLang(copy.lang);
  }, [copy.lang]);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setInfo("");
    setOtp("");
  }

  async function afterAuthenticated() {
    await getOrCreateAccountClient();
    router.push("/console/overview");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          setError(signInError.message || copy.authFailed);
          return;
        }
        await afterAuthenticated();
        return;
      }

      if (mode === "signup") {
        const origin = window.location.origin;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/console/overview`,
          },
        });
        if (signUpError) {
          setError(signUpError.message || copy.authFailed);
          return;
        }
        if (data.session) {
          await afterAuthenticated();
          return;
        }
        setInfo(copy.otpSent);
        setMode("otp");
        return;
      }

      if (mode === "otp") {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: otp.trim(),
          type: "signup",
        });
        if (otpError) {
          setError(otpError.message || copy.otpInvalid);
          return;
        }
        await afterAuthenticated();
        return;
      }

      if (mode === "forgot") {
        const origin = window.location.origin;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          { redirectTo: `${origin}/console/reset-password` },
        );
        if (resetError) {
          setError(resetError.message || copy.authFailed);
          return;
        }
        setInfo(copy.resetSent);
        return;
      }
    } catch (requestError) {
      setError(copy.networkError);
      toast.exception(requestError, copy.networkError);
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "signup" ? copy.signupTitle
    : mode === "otp" ? copy.otpTitle
    : mode === "forgot" ? copy.forgotTitle
    : null;

  const submitLabel =
    mode === "signup" ? copy.signupSubmit
    : mode === "otp" ? copy.otpSubmit
    : mode === "forgot" ? copy.forgotSubmit
    : copy.submit;

  return (
    <form
      onSubmit={submit}
      className="console-gate-form"
      aria-describedby={error ? "login-error" : info ? "login-info" : "login-help"}
    >
      <div className="console-gate-modes" role="tablist" aria-label={copy.modeAria}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin" || mode === "otp"}
          className="console-gate-mode"
          data-active={mode === "signin" || mode === "otp" ? "true" : "false"}
          onClick={() => switchMode("signin")}
        >
          {copy.modeSignIn}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className="console-gate-mode"
          data-active={mode === "signup" ? "true" : "false"}
          onClick={() => switchMode("signup")}
        >
          {copy.modeSignUp}
        </button>
      </div>

      {title && <h2 className="console-gate-form-title">{title}</h2>}

      <div className="console-gate-field">
        <label htmlFor="email">{copy.emailLabel}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="console-gate-input"
          dir="ltr"
          spellCheck={false}
          disabled={mode === "otp"}
        />
      </div>

      {(mode === "signin" || mode === "signup") && (
        <div className="console-gate-field">
          <div className="console-gate-label-row">
            <label htmlFor="password">{copy.passwordLabel}</label>
            <button
              type="button"
              className="console-gate-reveal"
              onClick={() => setReveal((value) => !value)}
              aria-pressed={reveal}
            >
              {reveal ? copy.hidePassword : copy.showPassword}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={reveal ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="console-gate-input"
            dir="ltr"
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
          <p id="login-help" className="console-gate-help">
            {mode === "signup" ? copy.signupHelp : copy.passwordHelp}
          </p>
        </div>
      )}

      {mode === "otp" && (
        <div className="console-gate-field">
          <label htmlFor="otp">{copy.otpLabel}</label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            className="console-gate-input"
            dir="ltr"
            spellCheck={false}
          />
          <p className="console-gate-help">{copy.otpHelp}</p>
        </div>
      )}

      {mode === "forgot" && (
        <p id="login-help" className="console-gate-help">
          {copy.forgotHelp}
        </p>
      )}

      {info && (
        <p id="login-info" role="status" className="console-gate-help">
          {info}
        </p>
      )}
      {error && (
        <p id="login-error" role="alert" className="console-gate-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="console-gate-submit"
        aria-busy={loading}
      >
        {loading ? copy.submitting : submitLabel}
      </button>

      <div className="console-gate-links">
        {mode === "signin" && (
          <button type="button" className="console-gate-link" onClick={() => switchMode("forgot")}>
            {copy.forgotLink}
          </button>
        )}
        {(mode === "forgot" || mode === "otp") && (
          <button type="button" className="console-gate-link" onClick={() => switchMode("signin")}>
            {copy.backToSignIn}
          </button>
        )}
      </div>
    </form>
  );
}
