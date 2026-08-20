"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  toast,
  toastMessage,
  type ToastKind,
} from "@/lib/toast";

const LABELS: Record<ToastKind, string> = {
  error: "Error",
  success: "Done",
  warning: "Notice",
  info: "Notice",
};

function isIgnorableError(error: unknown) {
  const message = toastMessage(error, "").toLowerCase();
  if (!message) return true;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return (
    message.includes("abort")
    || message.includes("resizeobserver")
    || message.includes("script error")
    || message.includes("hydration")
    || message.includes("getserversnapshot")
  );
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "success") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0L3.3 9.1a1 1 0 1 1 1.4-1.4l4.1 4.1 6.5-6.5a1 1 0 0 1 1.4 0Z" />
      </svg>
    );
  }
  if (kind === "warning") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10.9 3.4 18 16.2A1 1 0 0 1 17.1 17.5H2.9A1 1 0 0 1 2 16.2L9.1 3.4a1 1 0 0 1 1.8 0ZM10 8a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1Zm0 7.2a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" />
      </svg>
    );
  }
  if (kind === "info") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 6.2a1 1 0 0 0-1 1V14a1 1 0 1 0 2 0V9.2a1 1 0 0 0-1-1Zm0-3.1a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4.2a1 1 0 0 0-1 1v4.1a1 1 0 1 0 2 0V7.2a1 1 0 0 0-1-1Zm0 8.3a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Z" />
    </svg>
  );
}

export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
  const [docLang, setDocLang] = useState("ar");
  const [docDir, setDocDir] = useState<"ltr" | "rtl">("rtl");

  useEffect(() => {
    const html = document.documentElement;
    function sync() {
      setDocLang(html.lang || "ar");
      setDocDir(html.dir === "ltr" ? "ltr" : "rtl");
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ["dir", "lang"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onError(event: ErrorEvent) {
      if (isIgnorableError(event.error ?? event.message)) return;
      toast.exception(event.error ?? event.message, "An unexpected browser error occurred.");
    }
    function onRejection(event: PromiseRejectionEvent) {
      if (isIgnorableError(event.reason)) return;
      toast.exception(event.reason, "An unhandled request failed.");
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="app-toaster"
      lang={docLang}
      dir={docDir}
      aria-live="polite"
      aria-relevant="additions text"
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="app-toast"
          data-kind={item.kind}
          role={item.kind === "error" || item.kind === "warning" ? "alert" : "status"}
        >
          <span className="app-toast-icon">
            <ToastIcon kind={item.kind} />
          </span>
          <div className="app-toast-copy">
            <strong>{item.title || LABELS[item.kind]}</strong>
            <p>{item.message}</p>
          </div>
          <button
            type="button"
            className="app-toast-dismiss"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(item.id)}
          >
            ×
          </button>
        </article>
      ))}
    </div>
  );
}
