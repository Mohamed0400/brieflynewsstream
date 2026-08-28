import { getOpsSettings, type OpsSettings } from "@/lib/ops-settings";

export type MaintenanceStatus = {
  apiActive: boolean;
  apiMessage: string;
  scheduledAt: string | null;
  notice: string;
  /** Seconds until scheduled maintenance, when scheduled in the future. */
  countdownSeconds: number | null;
};

export function parseMaintenanceInstant(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildMaintenanceStatus(settings: Pick<
  OpsSettings,
  "apiMaintenanceActive" | "apiMaintenanceMessage" | "apiMaintenanceScheduledAt" | "apiMaintenanceNotice"
>, now = new Date()): MaintenanceStatus {
  const scheduledAt = settings.apiMaintenanceScheduledAt?.trim() || null;
  const scheduled = parseMaintenanceInstant(scheduledAt);
  let countdownSeconds: number | null = null;
  if (scheduled && scheduled.getTime() > now.getTime()) {
    countdownSeconds = Math.max(0, Math.ceil((scheduled.getTime() - now.getTime()) / 1000));
  }

  return {
    apiActive: settings.apiMaintenanceActive,
    apiMessage: settings.apiMaintenanceMessage.trim()
      || "Briefly NewsStream API is temporarily unavailable for scheduled maintenance. Please retry shortly.",
    scheduledAt,
    notice: settings.apiMaintenanceNotice.trim(),
    countdownSeconds,
  };
}

export async function getMaintenanceStatus(now = new Date()) {
  const settings = await getOpsSettings();
  return buildMaintenanceStatus(settings, now);
}

export function formatMaintenanceCountdown(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
