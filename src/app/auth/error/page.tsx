import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confirmation link",
  robots: { index: false, follow: false },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const message = (await searchParams).message?.replace(/\+/g, " ")
    || "This confirmation link could not be completed.";
  const pkce = /code verifier|pkce/i.test(message);

  return (
    <main className="auth-callback" lang="ar" dir="rtl">
      <h1>تعذّر تأكيد الحساب</h1>
      <p role="alert">{message}</p>
      {pkce ? (
        <p>
          افتح رابط التأكيد في نفس المتصفح الذي سجّلت منه، وليس من تطبيق البريد.
          ثم سجّل الدخول بعد التأكيد.
        </p>
      ) : null}
      <p>
        <Link href="/console/signup" className="console-gate-link">العودة إلى التسجيل</Link>
        {" · "}
        <Link href="/console/login" className="console-gate-link">تسجيل الدخول</Link>
      </p>
    </main>
  );
}
