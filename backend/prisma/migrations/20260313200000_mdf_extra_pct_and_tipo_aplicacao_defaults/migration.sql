-- Normalize product labels for strategy and keep compatibility with old records.
UPDATE `produtos`
SET `tipo_aplicacao` = 'MDF'
WHERE `tipo_aplicacao` = 'MATERIA_PRIMA' OR `tipo_aplicacao` IS NULL;

ALTER TABLE `produtos`
MODIFY `tipo_aplicacao` VARCHAR(191) NOT NULL DEFAULT 'MDF';

-- Store MDF extra percentage used in the fixed matrix calculation.
SET @has_operational_matrix := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'operational_matrix'
);

SET @has_mdf_extra_pct := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'operational_matrix'
		AND COLUMN_NAME = 'mdf_extra_pct'
);

SET @add_mdf_extra_pct_sql := IF(
	@has_operational_matrix = 1 AND @has_mdf_extra_pct = 0,
	'ALTER TABLE `operational_matrix` ADD COLUMN `mdf_extra_pct` DOUBLE NOT NULL DEFAULT 0',
	'SELECT 1'
);

PREPARE add_mdf_extra_pct_stmt FROM @add_mdf_extra_pct_sql;
EXECUTE add_mdf_extra_pct_stmt;
DEALLOCATE PREPARE add_mdf_extra_pct_stmt;
