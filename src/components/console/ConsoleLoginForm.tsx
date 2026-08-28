"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  persistConsoleLang,
  withConsoleLang,
  type ConsoleLoginCopy,
} from "@/lib/console-translation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { withAuthTimeout } from "@/lib/supabase/auth-timeout";
import { establishConsoleSessionClient, AuthTimeoutError } from "@/lib/account-client";
import { ADMIN_OPERATIONS_PATH } from "@/lib/admin-app";
import { consoleAuthCallbackUrl } from "@/lib/auth-redirect";
import {
  isBlockedAccountStatus,
  isDuplicateSignupError,
  isDuplicateSignupUser,
} from "@/lib/console-signup-auth";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { normalizeSignupProfile } from "@/lib/signup-profile";
import { BrandLoader } from "@/components/media/BrandLoader";

type Mode = "signin" | "signup" | "check-email" | "forgot";

export function ConsoleLoginForm({
  copy,
  variant,
  audience = "customer",
  initialError = "",
  initialMode,
}: {
  copy: ConsoleLoginCopy;
  variant: "signin" | "signup";
  audience?: "customer" | "ops";
  initialError?: string;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode || variant);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [error, setError] = useState(initialError);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);
  const isOps = audience === "ops";

  const countries = useMemo(() => {
    return [...COUNTRY_CATALOG].sort((a, b) => {
      const left = copy.lang === "ar" ? a.nameAr : a.country;
      const right = copy.lang === "ar" ? b.nameAr : b.country;
      return left.localeCompare(right, copy.lang === "ar" ? "ar" : "en");
    });
  }, [copy.lang]);

  useEffect(() => {
    persistConsoleLang(copy.lang);
  }, [copy.lang]);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setInfo("");
  }

  async function afterAuthenticated() {
    const payload = await establishConsoleSessionClient();
    if (isBlockedAccountStatus(payload.account.status)) {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      setError(copy.accountUnavailable);
      return;
    }
    if (isOps) {
      if (payload.account.role !== "SUPER_ADMIN") {
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
        setError(copy.opsDenied);
        return;
      }
      router.push(ADMIN_OPERATIONS_PATH);
      router.refresh();
      return;
    }
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
        const { error: signInError } = await withAuthTimeout(
          supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          }),
          12_000,
        );
        if (signInError) {
          setError(signInError.message || copy.authFailed);
          emailRef.current?.focus();
          return;
        }
        await afterAuthenticated();
        return;
      }

      if (mode === "signup") {
        const parsed = normalizeSignupProfile({ country, address, mobilePhone });
        if (parsed.error || !parsed.profile) {
          setError(parsed.error || copy.profileInvalid);
          return;
        }
        const origin = window.location.origin;
        const { data, error: signUpError } = await withAuthTimeout(
          supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: consoleAuthCallbackUrl(origin),
              data: parsed.profile,
            },
          }),
          12_000,
        );
        if (signUpError) {
          setError(
            isDuplicateSignupError(signUpError.message)
              ? copy.emailAlreadyRegistered
              : signUpError.message || copy.authFailed,
          );
          emailRef.current?.focus();
          return;
        }
        if (isDuplicateSignupUser(data.user)) {
          setError(copy.emailAlreadyRegistered);
          emailRef.current?.focus();
          return;
        }
        if (data.session) {
          await afterAuthenticated();
          return;
        }
        setInfo(copy.confirmSent);
        setMode("check-email");
        return;
      }

      if (mode === "forgot") {
        const origin = window.location.origin;
        const { error: resetError } = await withAuthTimeout(
          supabase.auth.resetPasswordForEmail(
            normalizedEmail,
            { redirectTo: consoleAuthCallbackUrl(origin, "/console/reset-password") },
          ),
          12_000,
        );
        if (resetError) {
          setError(resetError.message || copy.authFailed);
          emailRef.current?.focus();
          return;
        }
        setInfo(copy.resetSent);
        return;
      }
    } catch (requestError) {
      const networkMessage = mode === "signup" ? copy.signupNetworkError : copy.networkError;
      setError(
        requestError instanceof AuthTimeoutError ? networkMessage : networkMessage,
      );
      toast.exception(requestError, networkMessage);
      emailRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  const heading =
    mode === "check-email" ? copy.confirmTitle
    : mode === "forgot" ? copy.forgotTitle
    : null;

  const submitLabel =
    mode === "signup" ? copy.signupSubmit
    : mode === "forgot" ? copy.forgotSubmit
    : copy.submit;

  const helpId =
    mode === "signin" || mode === "signup" || mode === "forgot" ? "login-help" : undefined;
  const describedBy = error ? "login-error" : info ? "login-info" : helpId;

  if (mode === "check-email") {
    return (
      <div className="console-gate-form console-gate-confirm" role="status">
        <h2 className="console-gate-form-title">{copy.confirmTitle}</h2>
        <p className="console-gate-help">{info || copy.confirmSent}</p>
        <p className="console-gate-help">{copy.confirmHint}</p>
        <Link href={withConsoleLang("/console/login", copy.lang)} className="console-gate-link">
          {copy.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="console-gate-form"
      aria-describedby={describedBy}
    >
      {heading ? <h2 className="console-gate-form-title">{heading}</h2> : null}

      <div className="console-gate-field">
        <label htmlFor="email">{copy.emailLabel}</label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="console-gate-input"
          dir="ltr"
          spellCheck={false}
          aria-invalid={Boolean(error)}
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
              aria-controls="password"
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
            aria-describedby={helpId}
          />
          <p id="login-help" className="console-gate-help">
            {mode === "signup" ? copy.signupHelp : isOps ? copy.opsPasswordHelp : copy.passwordHelp}
          </p>
        </div>
      )}

      {mode === "signup" && (
        <>
          <div className="console-gate-field">
            <label htmlFor="country">{copy.countryLabel}</label>
            <select
              id="country"
              name="country"
              required
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="console-gate-input"
            >
              <option value="">{copy.countryPlaceholder}</option>
              {countries.map((item) => (
                <option key={item.code} value={item.code}>
                  {copy.lang === "ar" ? `${item.nameAr} (${item.code})` : `${item.country} (${item.code})`}
                </option>
              ))}
            </select>
          </div>
          <div className="console-gate-field">
            <label htmlFor="mobile">{copy.mobileLabel}</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              value={mobilePhone}
              onChange={(event) => setMobilePhone(event.target.value)}
              className="console-gate-input"
              dir="ltr"
              placeholder={copy.mobilePlaceholder}
            />
            <p className="console-gate-help">{copy.mobileHelp}</p>
          </div>
          <div className="console-gate-field">
            <label htmlFor="address">{copy.addressLabel}</label>
            <textarea
              id="address"
              name="address"
              required
              minLength={8}
              maxLength={200}
              rows={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="console-gate-input"
            />
          </div>
        </>
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
        {loading ? (
          <>
            <BrandLoader size="sm" decorative />
            <span>{copy.submitting}</span>
          </>
        ) : (
          submitLabel
        )}
      </button>

      <div className="console-gate-links">
        {!isOps && mode === "signin" && (
          <button type="button" className="console-gate-link" onClick={() => switchMode("forgot")}>
            {copy.forgotLink}
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" className="console-gate-link" onClick={() => switchMode("signin")}>
            {copy.backToSignIn}
          </button>
        )}
      </div>

      {!isOps && mode !== "forgot" && (
        <p className="console-gate-switch">
          {variant === "signup" ? copy.haveAccount : copy.needAccount}{" "}
          <Link
            href={withConsoleLang(
              variant === "signup" ? "/console/login" : "/console/signup",
              copy.lang,
            )}
            className="console-gate-link"
          >
            {variant === "signup" ? copy.signInLink : copy.createAccountLink}
          </Link>
        </p>
      )}
    </form>
  );
}
