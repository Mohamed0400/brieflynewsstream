import type { PlanTier } from "@prisma/client";

export type PlanDefinition = {
  tier: PlanTier;
  label: string;
  listPriceMonthlyUsd: number | null;
  dailyRequests: number;
  maxKeys: number;
  commercialUse: boolean;
  communityBriefings: boolean;
  archiveAccess: "limited" | "full";
};

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    label: "Free",
    listPriceMonthlyUsd: 0,
    dailyRequests: 5,
    maxKeys: 2,
    commercialUse: false,
    communityBriefings: true,
    archiveAccess: "full",
  },
  PRO: {
    tier: "PRO",
    label: "Pro",
    listPriceMonthlyUsd: 70,
    dailyRequests: 500,
    maxKeys: 10,
    commercialUse: true,
    communityBriefings: true,
    archiveAccess: "full",
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    label: "Enterprise",
    listPriceMonthlyUsd: null,
    dailyRequests: 20_000,
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
