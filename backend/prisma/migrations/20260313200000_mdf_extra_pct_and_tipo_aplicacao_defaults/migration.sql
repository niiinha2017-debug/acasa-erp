-- Normalize product labels for strategy and keep compatibility with old records.
UPDATE "produtos"
SET "tipo_aplicacao" = 'MDF'
WHERE "tipo_aplicacao" = 'MATERIA_PRIMA' OR "tipo_aplicacao" IS NULL;

ALTER TABLE "produtos"
ALTER COLUMN "tipo_aplicacao" SET DEFAULT 'MDF';

-- Store MDF extra percentage used in the fixed matrix calculation.
ALTER TABLE "operational_matrix"
ADD COLUMN "mdf_extra_pct" DOUBLE PRECISION NOT NULL DEFAULT 0;
