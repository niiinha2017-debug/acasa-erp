-- Normalize product labels for strategy and keep compatibility with old records.
UPDATE `produtos`
SET `tipo_aplicacao` = 'MDF'
WHERE `tipo_aplicacao` = 'MATERIA_PRIMA' OR `tipo_aplicacao` IS NULL;

ALTER TABLE `produtos`
MODIFY `tipo_aplicacao` VARCHAR(191) NOT NULL DEFAULT 'MDF';

-- Store MDF extra percentage used in the fixed matrix calculation.
ALTER TABLE `operational_matrix`
ADD COLUMN `mdf_extra_pct` DOUBLE NOT NULL DEFAULT 0;
