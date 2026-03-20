-- Repara drift de schema em ambientes onde o historico do Prisma foi marcado,
-- mas colunas/tabelas ainda nao existem fisicamente.

-- fornecedor.saldo_credito
SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fornecedor'
      AND COLUMN_NAME = 'saldo_credito'
  ) = 0,
  'ALTER TABLE `fornecedor` ADD COLUMN `saldo_credito` DECIMAL(10, 2) NULL AFTER `prazo_entrega_dias`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- produtos.categoria_base
SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'produtos'
      AND COLUMN_NAME = 'categoria_base'
  ) = 0,
  'ALTER TABLE `produtos` ADD COLUMN `categoria_base` VARCHAR(191) NULL AFTER `insumo_consumo_m2`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `produtos`
SET `categoria_base` = 'PRIMARIA'
WHERE `categoria_base` IS NULL OR TRIM(`categoria_base`) = '';

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'produtos'
      AND COLUMN_NAME = 'categoria_base'
      AND (IS_NULLABLE = 'YES' OR COALESCE(COLUMN_DEFAULT, '') <> 'PRIMARIA')
  ) > 0,
  'ALTER TABLE `produtos` MODIFY `categoria_base` VARCHAR(191) NOT NULL DEFAULT ''PRIMARIA''',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- produtos.categoria_ferragem
SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'produtos'
      AND COLUMN_NAME = 'categoria_ferragem'
  ) = 0,
  'ALTER TABLE `produtos` ADD COLUMN `categoria_ferragem` VARCHAR(191) NULL AFTER `fita_vinculada_id`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- operational_matrix
CREATE TABLE IF NOT EXISTS `operational_matrix` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(100) NOT NULL,
  `thickness` INT NOT NULL,
  `group` VARCHAR(200) NOT NULL,
  `min_cost_base` DOUBLE NOT NULL,
  `avg_cost_base` DOUBLE NOT NULL,
  `max_cost_base` DOUBLE NOT NULL,
  `mdf_extra_pct` DOUBLE NOT NULL DEFAULT 0,
  `fix_insumo_value` DOUBLE NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `operational_matrix_category_thickness_group_key` (`category`, `thickness`, `group`),
  PRIMARY KEY (`id`)
);

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'operational_matrix'
      AND COLUMN_NAME = 'mdf_extra_pct'
  ) = 0,
  'ALTER TABLE `operational_matrix` ADD COLUMN `mdf_extra_pct` DOUBLE NOT NULL DEFAULT 0 AFTER `max_cost_base`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;