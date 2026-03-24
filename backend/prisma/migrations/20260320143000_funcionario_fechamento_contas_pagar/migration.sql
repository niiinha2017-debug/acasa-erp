-- Fluxo: fechamento de pagamento por funcionario + integracao com contas_pagar
-- Migration idempotente para contornar ambientes com drift/permissoes restritas de shadow DB.

-- 1) contas_pagar.fornecedor_id opcional
SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contas_pagar'
      AND COLUMN_NAME = 'fornecedor_id'
      AND IS_NULLABLE = 'NO'
  ) > 0,
  'ALTER TABLE `contas_pagar` MODIFY `fornecedor_id` INT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Colunas novas em contas_pagar
SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contas_pagar'
      AND COLUMN_NAME = 'funcionario_id'
  ) = 0,
  'ALTER TABLE `contas_pagar` ADD COLUMN `funcionario_id` INT NULL AFTER `fornecedor_id`',
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
      AND TABLE_NAME = 'contas_pagar'
      AND COLUMN_NAME = 'fechamento_funcionario_id'
  ) = 0,
  'ALTER TABLE `contas_pagar` ADD COLUMN `fechamento_funcionario_id` INT NULL AFTER `fechamento_fornecedor_id`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Tabela funcionario_fechamentos
CREATE TABLE IF NOT EXISTS `funcionario_fechamentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `funcionario_id` INT NOT NULL,
  `mes_referencia` INT NOT NULL,
  `ano_referencia` INT NOT NULL,
  `forma_pagamento_chave` VARCHAR(191) NULL,
  `dia_pagamento_snapshot` INT NULL,
  `salario_base_snapshot` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `salario_adicional_snapshot` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `beneficios_snapshot` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `descontos_snapshot` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `horas_extras_valor` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `valor_bruto` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `valor_liquido` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(191) NOT NULL DEFAULT 'EM_ABERTO',
  `observacao` VARCHAR(191) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ff_func_mes_ano_uk` (`funcionario_id`, `mes_referencia`, `ano_referencia`),
  INDEX `ff_func_idx` (`funcionario_id`),
  INDEX `ff_status_idx` (`status`)
);

-- 4) Tabela funcionario_fechamento_itens
CREATE TABLE IF NOT EXISTS `funcionario_fechamento_itens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fechamento_id` INT NOT NULL,
  `tipo_item` VARCHAR(191) NOT NULL,
  `rubrica` VARCHAR(191) NOT NULL,
  `valor` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `observacao` VARCHAR(191) NULL,
  `ordem` INT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `funcionario_fechamento_itens_fechamento_id_idx` (`fechamento_id`),
  INDEX `funcionario_fechamento_itens_tipo_item_idx` (`tipo_item`),
  INDEX `funcionario_fechamento_itens_rubrica_idx` (`rubrica`)
);

-- 5) Indices em contas_pagar
SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contas_pagar'
      AND INDEX_NAME = 'contas_pagar_funcionario_id_idx'
  ) = 0,
  'CREATE INDEX `contas_pagar_funcionario_id_idx` ON `contas_pagar`(`funcionario_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contas_pagar'
      AND INDEX_NAME = 'contas_pagar_fechamento_funcionario_id_idx'
  ) = 0,
  'CREATE INDEX `contas_pagar_fechamento_funcionario_id_idx` ON `contas_pagar`(`fechamento_funcionario_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contas_pagar'
      AND INDEX_NAME = 'contas_pagar_fechamento_funcionario_id_key'
  ) = 0,
  'CREATE UNIQUE INDEX `contas_pagar_fechamento_funcionario_id_key` ON `contas_pagar`(`fechamento_funcionario_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) FKs (somente se ainda nao existem)
SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'contas_pagar_funcionario_id_fkey'
  ) = 0,
  'ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'contas_pagar_fechamento_funcionario_id_fkey'
  ) = 0,
  'ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_fechamento_funcionario_id_fkey` FOREIGN KEY (`fechamento_funcionario_id`) REFERENCES `funcionario_fechamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'funcionario_fechamentos_funcionario_id_fkey'
  ) = 0,
  'ALTER TABLE `funcionario_fechamentos` ADD CONSTRAINT `funcionario_fechamentos_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'funcionario_fechamento_itens_fechamento_id_fkey'
  ) = 0,
  'ALTER TABLE `funcionario_fechamento_itens` ADD CONSTRAINT `funcionario_fechamento_itens_fechamento_id_fkey` FOREIGN KEY (`fechamento_id`) REFERENCES `funcionario_fechamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
