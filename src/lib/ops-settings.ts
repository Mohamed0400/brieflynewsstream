import { prisma } from "@/lib/prisma";

export const DEFAULT_OPS_SETTINGS = {
  pageViewTracking: true,
  attributionCapture: true,
  quotaResetConfirmPhrase: "RESET QUOTA",
  notifyOnQuotaReset: false,
  maintenanceBanner: "",
  apiMaintenanceActive: false,
  apiMaintenanceMessage:
    "Briefly NewsStream API is temporarily unavailable for scheduled maintenance. Please retry shortly.",
  apiMaintenanceScheduledAt: null as string | null,
  apiMaintenanceNotice: "",
} as const;

export type OpsSettings = {
  pageViewTracking: boolean;
  attributionCapture: boolean;
  quotaResetConfirmPhrase: string;
  notifyOnQuotaReset: boolean;
  maintenanceBanner: string;
  apiMaintenanceActive: boolean;
  apiMaintenanceMessage: string;
  apiMaintenanceScheduledAt: string | null;
  apiMaintenanceNotice: string;
};

export type PublicSiteSettings = Pick<
  OpsSettings,
  "pageViewTracking" | "attributionCapture" | "maintenanceBanner"
>;

function mergeOpsSettings(rows: Array<{ key: string; value: unknown }>): OpsSettings {
  const merged: OpsSettings = { ...DEFAULT_OPS_SETTINGS };
  for (const row of rows) {
    if (row.key in merged) {
      (merged as Record<string, unknown>)[row.key] = row.value;
    }
  }
  return merged;
}

export async function getOpsSettings(): Promise<OpsSettings> {
  const rows = await prisma.opsSetting.findMany().catch(() => []);
  return mergeOpsSettings(rows);
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const settings = await getOpsSettings();
  return {
    pageViewTracking: settings.pageViewTracking,
    attributionCapture: settings.attributionCapture,
    maintenanceBanner: settings.maintenanceBanner,
  };
}
