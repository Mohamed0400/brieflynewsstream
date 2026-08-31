-- Separate Arabic-only ingest pipeline (no Gemini translation).
ALTER TABLE "Source" ADD COLUMN "sourceLocale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Source" ADD COLUMN "collectPipeline" TEXT NOT NULL DEFAULT 'main';
CREATE INDEX "Source_collectPipeline_enabled_idx" ON "Source"("collectPipeline", "enabled");
