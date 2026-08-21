-- Denormalize ranking onto Article so default sort=score does not join ArticleScore.
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "finalScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Article" AS article
SET "finalScore" = score."finalScore"
FROM "ArticleScore" AS score
WHERE score."articleId" = article.id;

-- Filter and sort paths used by market-news, briefing, and ingest.
CREATE INDEX IF NOT EXISTS "Article_sourceId_publishedAt_idx"
  ON "Article" ("sourceId", "publishedAt" DESC);

CREATE INDEX IF NOT EXISTS "Article_publishedAt_finalScore_idx"
  ON "Article" ("publishedAt" DESC, "finalScore" DESC);

CREATE INDEX IF NOT EXISTS "Article_country_publishedAt_finalScore_idx"
  ON "Article" ("country", "publishedAt" DESC, "finalScore" DESC);

CREATE INDEX IF NOT EXISTS "ArticleScore_finalScore_articleId_idx"
  ON "ArticleScore" ("finalScore" DESC, "articleId");

CREATE INDEX IF NOT EXISTS "DailyEdition_status_date_idx"
  ON "DailyEdition" ("status", "date" DESC);

CREATE INDEX IF NOT EXISTS "Source_enabled_country_idx"
  ON "Source" ("enabled", "country");

CREATE INDEX IF NOT EXISTS "RawArticle_publishedAt_idx"
  ON "RawArticle" ("publishedAt");

CREATE INDEX IF NOT EXISTS "RawArticle_unprocessed_publishedAt_idx"
  ON "RawArticle" ("publishedAt" DESC)
  WHERE "processedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Invoice_accountId_status_planTier_example_idx"
  ON "Invoice" ("accountId", "status", "planTier", "example");
