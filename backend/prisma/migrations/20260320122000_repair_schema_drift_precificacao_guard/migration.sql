-- Blindagem adicional de drift para módulos de precificacao.
-- Idempotente: pode ser executada em ambientes ja corrigidos sem efeitos colaterais.

-- Tabela de matriz operacional (caso ambiente antigo nao a tenha)
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

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'operational_matrix'
      AND COLUMN_NAME = 'fix_insumo_value'
  ) = 0,
  'ALTER TABLE `operational_matrix` ADD COLUMN `fix_insumo_value` DOUBLE NOT NULL DEFAULT 0 AFTER `mdf_extra_pct`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tabela de configuracoes de preco (fallback quando migration antiga foi marcada mas nao aplicada)
CREATE TABLE IF NOT EXISTS `configuracoes_preco` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `categoria_comercial` VARCHAR(40) NOT NULL,
  `mdf_min_value` DOUBLE NOT NULL DEFAULT 0,
  `mdf_avg_value` DOUBLE NOT NULL DEFAULT 0,
  `mdf_max_value` DOUBLE NOT NULL DEFAULT 0,
  `fita_value` DOUBLE NOT NULL DEFAULT 0,
  `insumo_value` DOUBLE NOT NULL DEFAULT 0,
  `rh_despesas_value` DOUBLE NOT NULL DEFAULT 0,
  `final_min_value` DOUBLE NOT NULL DEFAULT 0,
  `final_avg_value` DOUBLE NOT NULL DEFAULT 0,
  `final_max_value` DOUBLE NOT NULL DEFAULT 0,
  `origem` VARCHAR(60) NOT NULL DEFAULT 'MATRIZ_OPERACIONAL',
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `configuracoes_preco_categoria_comercial_key` (`categoria_comercial`),
  PRIMARY KEY (`id`)
);