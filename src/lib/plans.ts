import type { PlanTier } from "@prisma/client";

export type PlanDefinition = {
  tier: PlanTier;
  label: string;
  listPriceMonthlyUsd: number | null;
  dailyRequests: number;
  /** null = no monthly cap (paid plans). */
  monthlyRequests: number | null;
  /** null = no yearly cap (paid plans). */
  yearlyRequests: number | null;
  maxKeys: number;
  commercialUse: boolean;
  communityBriefings: boolean;
  archiveAccess: "limited" | "full";
};

export function planPriceCents(tier: PlanTier) {
  const usd = PLAN_DEFINITIONS[tier].listPriceMonthlyUsd;
  if (usd == null || usd <= 0) return 0;
  return usd * 100;
}

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    label: "Free",
    listPriceMonthlyUsd: 0,
    dailyRequests: 3,
    monthlyRequests: 10,
    yearlyRequests: 100,
    maxKeys: 1,
    commercialUse: false,
    communityBriefings: true,
    archiveAccess: "full",
  },
  PRO: {
    tier: "PRO",
    label: "Pro",
    listPriceMonthlyUsd: 80,
    dailyRequests: 500,
    monthlyRequests: null,
    yearlyRequests: null,
    maxKeys: 10,
    commercialUse: true,
    communityBriefings: true,
    archiveAccess: "full",
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    label: "Enterprise",
    listPriceMonthlyUsd: 150,
    dailyRequests: 20_000,
    monthlyRequests: null,
    yearlyRequests: null,
    maxKeys: 100,
    commercialUse: true,
    communityBriefings: true,
    archiveAccess: "full",
  },
};

export function formatPlanCount(value: number) {
  return value.toLocaleString("en-US");
}

export function resolvePlanLimits(input: {
  plan: PlanTier;
  dailyPointsOverride?: number | null;
  maxKeysOverride?: number | null;
}) {
  const base = PLAN_DEFINITIONS[input.plan];
  return {
    ...base,
    dailyRequests: input.dailyPointsOverride ?? base.dailyRequests,
    maxKeys: input.maxKeysOverride ?? base.maxKeys,
  };
}

export function utcDayWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function utcMonthWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function utcYearWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
  return { start, end };
}
