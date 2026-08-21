DO $$ BEGIN
  CREATE TYPE "PlanSource" AS ENUM ('DEFAULT', 'ADMIN', 'SUBSCRIPTION', 'INVOICE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'VOID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "planSource" "PlanSource" NOT NULL DEFAULT 'DEFAULT';

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "planTier" "PlanTier" NOT NULL DEFAULT 'PRO';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

DROP TABLE IF EXISTS "InvoiceSnapshot" CASCADE;

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "planTier" "PlanTier" NOT NULL,
    "description" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "providerRef" TEXT,
    "example" BOOLEAN NOT NULL DEFAULT false,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "method" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "providerRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_providerRef_key" ON "Invoice"("providerRef");
CREATE INDEX IF NOT EXISTS "Invoice_accountId_issuedAt_idx" ON "Invoice"("accountId", "issuedAt");
CREATE INDEX IF NOT EXISTS "Invoice_status_issuedAt_idx" ON "Invoice"("status", "issuedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_providerRef_key" ON "Payment"("providerRef");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_createdAt_idx" ON "Payment"("invoiceId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
