"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { PUBLIC_PAGE_ERROR } from "@/lib/public-error";

const copy = {
  en: {
    title: "The page could not be loaded",
    tryAgain: "Try again",
    reference: "Reference",
  },
  ar: {
    title: "تعذّر تحميل الصفحة",
    tryAgain: "أعد المحاولة",
    reference: "المرجع",
  },
} as const;

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "ar";
  const t = copy[lang];
  const message =
    lang === "ar"
      ? "حدث خطأ غير متوقع. أعد المحاولة بعد قليل."
      : PUBLIC_PAGE_ERROR;

  useEffect(() => {
    console.error("Marketing error", error.digest ?? "unknown");
    toast.error(message, t.title);
  }, [error, message, t.title]);

  return (
    <div className="mkt-section" lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <div className="mkt-section-head">
        <h1>{t.title}</h1>
        <p>{message}</p>
        {error.digest ? (
          <p>
            {t.reference} {error.digest}
          </p>
        ) : null}
      </div>
      <button type="button" className="mkt-btn mkt-btn-primary" onClick={() => reset()}>
        {t.tryAgain}
      </button>
    </div>
  );
}
