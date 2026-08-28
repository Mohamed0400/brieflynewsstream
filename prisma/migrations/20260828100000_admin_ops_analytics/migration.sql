-- Super-admin ops: attribution on accounts, page views, ops settings

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "utmSource" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "utmContent" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "signupReferrer" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "signupLandingPath" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "trafficChannel" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT NOT NULL DEFAULT '',
    "utmSource" TEXT NOT NULL DEFAULT '',
    "utmMedium" TEXT NOT NULL DEFAULT '',
    "utmCampaign" TEXT NOT NULL DEFAULT '',
    "utmContent" TEXT NOT NULL DEFAULT '',
    "utmTerm" TEXT NOT NULL DEFAULT '',
    "channel" TEXT NOT NULL DEFAULT '',
    "locale" TEXT NOT NULL DEFAULT '',
    "sessionId" TEXT NOT NULL DEFAULT '',
    "accountId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PageView_viewedAt_idx" ON "PageView"("viewedAt");
CREATE INDEX IF NOT EXISTS "PageView_path_viewedAt_idx" ON "PageView"("path", "viewedAt");
CREATE INDEX IF NOT EXISTS "PageView_channel_viewedAt_idx" ON "PageView"("channel", "viewedAt");
CREATE INDEX IF NOT EXISTS "PageView_utmSource_viewedAt_idx" ON "PageView"("utmSource", "viewedAt");
CREATE INDEX IF NOT EXISTS "PageView_sessionId_viewedAt_idx" ON "PageView"("sessionId", "viewedAt");

CREATE TABLE IF NOT EXISTS "OpsSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OpsSetting_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
