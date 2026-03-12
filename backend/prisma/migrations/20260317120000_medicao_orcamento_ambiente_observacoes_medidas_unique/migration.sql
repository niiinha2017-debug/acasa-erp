-- Add observacoes only if missing
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medicao_orcamento_ambiente' AND COLUMN_NAME = 'observacoes') = 0,
  'ALTER TABLE `medicao_orcamento_ambiente` ADD COLUMN `observacoes` TEXT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add medidas_json only if missing
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medicao_orcamento_ambiente' AND COLUMN_NAME = 'medidas_json') = 0,
  'ALTER TABLE `medicao_orcamento_ambiente` ADD COLUMN `medidas_json` TEXT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove duplicate (medicao_orcamento_id, nome_ambiente) keeping the one with lower id
DELETE a FROM medicao_orcamento_ambiente a
INNER JOIN medicao_orcamento_ambiente b
  ON a.medicao_orcamento_id = b.medicao_orcamento_id AND a.nome_ambiente = b.nome_ambiente AND a.id > b.id;

-- Create unique index only if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medicao_orcamento_ambiente' AND INDEX_NAME = 'moa_orc_id_nome_ambiente_unique') = 0,
  'CREATE UNIQUE INDEX `moa_orc_id_nome_ambiente_unique` ON `medicao_orcamento_ambiente`(`medicao_orcamento_id`, `nome_ambiente`)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
