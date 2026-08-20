-- CreateEnum
CREATE TYPE "Category" AS ENUM ('GOLD', 'FINANCE', 'ECONOMICS', 'OIL', 'ME_ECONOMY', 'COMMODITIES', 'MARKETS');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('MIDDLE_EAST', 'AMERICA', 'GLOBAL');

-- CreateEnum
CREATE TYPE "EditionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('MEMBER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "adapter" TEXT NOT NULL DEFAULT 'rss',
    "country" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "defaultCategory" "Category",
    "qualityWeight" INTEGER NOT NULL DEFAULT 70,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawArticle" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "summary" TEXT,
    "publisher" TEXT,
    "audienceCodes" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "rawJson" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "displayTitle" TEXT,
    "displaySummary" TEXT,
    "titleEn" TEXT,
    "summaryEn" TEXT,
    "titleAr" TEXT,
    "summaryAr" TEXT,
    "translatedAt" TIMESTAMP(3),
    "editorializedAt" TIMESTAMP(3),
    "publisher" TEXT,
    "audienceCodes" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" "Category" NOT NULL,
    "secondaryTags" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "contentHash" TEXT NOT NULL,
    "storyKey" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleScore" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL,
    "freshness" INTEGER NOT NULL,
    "sourceQuality" INTEGER NOT NULL,
    "goldImpact" INTEGER NOT NULL,
    "usdImpact" INTEGER NOT NULL,
    "ratesImpact" INTEGER NOT NULL,
    "oilImpact" INTEGER NOT NULL,
    "middleEastImpact" INTEGER NOT NULL,
    "marketImpact" INTEGER NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEdition" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "EditionStatus" NOT NULL DEFAULT 'DRAFT',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEditionItem" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "section" TEXT NOT NULL,

    CONSTRAINT "DailyEditionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'MEMBER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "dailyPointsOverride" INTEGER,
    "maxKeysOverride" INTEGER,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "pointsUsed" INTEGER NOT NULL DEFAULT 1,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "unitAmountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amountPaidCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountNote" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "lastError" TEXT,
    "lastSummary" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerHeartbeat" (
    "id" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "lastTickAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_code_key" ON "Source"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Source_url_key" ON "Source"("url");

-- CreateIndex
CREATE INDEX "RawArticle_processedAt_idx" ON "RawArticle"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RawArticle_sourceId_externalId_key" ON "RawArticle"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Article_contentHash_key" ON "Article"("contentHash");

-- CreateIndex
CREATE INDEX "Article_category_publishedAt_idx" ON "Article"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_country_publishedAt_idx" ON "Article"("country", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_region_category_idx" ON "Article"("region", "category");

-- CreateIndex
CREATE INDEX "Article_audienceCodes_idx" ON "Article"("audienceCodes");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_storyKey_sourceId_publishedAt_idx" ON "Article"("storyKey", "sourceId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleScore_articleId_key" ON "ArticleScore"("articleId");

-- CreateIndex
CREATE INDEX "ArticleScore_finalScore_idx" ON "ArticleScore"("finalScore");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEdition_date_key" ON "DailyEdition"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEditionItem_editionId_articleId_key" ON "DailyEditionItem"("editionId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEditionItem_editionId_rank_key" ON "DailyEditionItem"("editionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Account_authUserId_key" ON "Account"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_stripeCustomerId_key" ON "Account"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Account_plan_status_idx" ON "Account"("plan", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_accountId_idx" ON "ApiKey"("accountId");

-- CreateIndex
CREATE INDEX "ApiKey_revokedAt_idx" ON "ApiKey"("revokedAt");

-- CreateIndex
CREATE INDEX "ApiRequest_requestedAt_idx" ON "ApiRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "ApiRequest_endpoint_requestedAt_idx" ON "ApiRequest"("endpoint", "requestedAt");

-- CreateIndex
CREATE INDEX "ApiRequest_apiKeyId_requestedAt_idx" ON "ApiRequest"("apiKeyId", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_accountId_key" ON "Subscription"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSnapshot_stripeInvoiceId_key" ON "InvoiceSnapshot"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "InvoiceSnapshot_accountId_paidAt_idx" ON "InvoiceSnapshot"("accountId", "paidAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AccountNote_accountId_createdAt_idx" ON "AccountNote"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_accountId_idx" ON "SupportTicket"("accountId");

-- CreateIndex
CREATE INDEX "EnterpriseRequest_status_createdAt_idx" ON "EnterpriseRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseRequest_accountId_idx" ON "EnterpriseRequest"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJob_key_key" ON "ScheduledJob"("key");

-- AddForeignKey
ALTER TABLE "RawArticle" ADD CONSTRAINT "RawArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleScore" ADD CONSTRAINT "ArticleScore_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyEditionItem" ADD CONSTRAINT "DailyEditionItem_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "DailyEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyEditionItem" ADD CONSTRAINT "DailyEditionItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequest" ADD CONSTRAINT "ApiRequest_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSnapshot" ADD CONSTRAINT "InvoiceSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNote" ADD CONSTRAINT "AccountNote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseRequest" ADD CONSTRAINT "EnterpriseRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
