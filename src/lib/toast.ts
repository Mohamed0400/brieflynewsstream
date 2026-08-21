import { publicErrorMessage } from "./public-error";

export type ToastKind = "error" | "success" | "warning" | "info";

export type ToastInput = {
  kind?: ToastKind;
  title?: string;
  message: string;
  duration?: number;
};

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  duration: number;
  createdAt: number;
};

type Listener = () => void;

const DEFAULT_DURATION: Record<ToastKind, number> = {
  error: 8000,
  warning: 6500,
  success: 4500,
  info: 4500,
};

const MAX_TOASTS = 4;
const EMPTY_TOASTS: ToastItem[] = [];
const listeners = new Set<Listener>();
let toasts: ToastItem[] = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  for (const listener of listeners) listener();
}

function nextId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function durationFor(kind: ToastKind, duration?: number) {
  if (duration === 0) return 0;
  return duration ?? DEFAULT_DURATION[kind];
}

function scheduleDismiss(id: string, duration: number) {
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  if (duration <= 0) return;
  timers.set(id, setTimeout(() => dismissToast(id), duration));
}

export function getToasts() {
  return toasts;
}

export function getServerToasts() {
  return EMPTY_TOASTS;
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dismissToast(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  const next = toasts.filter((item) => item.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function clearToasts() {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  if (toasts.length === 0) return;
  toasts = [];
  emit();
}

export function pushToast(input: ToastInput) {
  const message = input.message.trim();
  if (!message) return "";

  const kind = input.kind ?? "info";
  const duplicate = toasts.find((item) => item.kind === kind && item.message === message);
  if (duplicate) {
    const duration = durationFor(kind, input.duration);
    toasts = toasts.map((item) => (
      item.id === duplicate.id
        ? { ...item, title: input.title ?? item.title, duration, createdAt: Date.now() }
        : item
    ));
    scheduleDismiss(duplicate.id, duration);
    emit();
    return duplicate.id;
  }

  const item: ToastItem = {
    id: nextId(),
    kind,
    title: input.title,
    message,
    duration: durationFor(kind, input.duration),
    createdAt: Date.now(),
  };
  toasts = [item, ...toasts].slice(0, MAX_TOASTS);
  scheduleDismiss(item.id, item.duration);
  emit();
  return item.id;
}

export function toastMessage(error: unknown, fallback: string) {
  return publicErrorMessage(error, fallback);
}

export const toast = {
  show: pushToast,
  dismiss: dismissToast,
  clear: clearToasts,
  error(message: string, title = "Error") {
    return pushToast({ kind: "error", title, message });
  },
  success(message: string, title = "Done") {
    return pushToast({ kind: "success", title, message });
  },
  warning(message: string, title = "Notice") {
    return pushToast({ kind: "warning", title, message });
  },
  info(message: string, title = "Notice") {
    return pushToast({ kind: "info", title, message });
  },
  exception(error: unknown, fallback = "An unexpected error occurred.") {
    return pushToast({
      kind: "error",
      title: "Unexpected error",
      message: toastMessage(error, fallback),
    });
  },
};
