-- Add product application type to separate fixed insumos from raw materials.
ALTER TABLE "produtos"
ADD COLUMN "tipo_aplicacao" TEXT NOT NULL DEFAULT 'MATERIA_PRIMA';

CREATE INDEX IF NOT EXISTS "produtos_tipo_aplicacao_idx"
ON "produtos"("tipo_aplicacao");
