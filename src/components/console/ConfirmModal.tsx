"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export type ConfirmTone = "danger" | "primary";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  closeLabel = "Close dialog",
  busyLabel = "Working...",
  tone = "danger",
  busy = false,
  lang,
  dir,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  closeLabel?: string;
  busyLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  lang?: "ar" | "en";
  dir?: "rtl" | "ltr";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancelRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, busy]);

  if (!open) return null;

  return createPortal(
    <div className="confirm-modal-root" lang={lang} dir={dir}>
      <button
        type="button"
        className="confirm-modal-backdrop"
        aria-label={closeLabel}
        disabled={busy}
        onClick={() => onCancelRef.current()}
      />
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="confirm-modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="console-secondary-button"
            disabled={busy}
            onClick={() => onCancelRef.current()}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "console-danger-button" : "console-primary-button"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
