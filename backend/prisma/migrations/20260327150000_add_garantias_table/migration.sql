-- Cria a tabela de garantias/assistencias tecnicas quando ainda nao existe no banco.
CREATE TABLE IF NOT EXISTS `garantias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cliente_id` INT NOT NULL,
  `venda_id` INT NULL,
  `funcionario_responsavel_id` INT NULL,
  `tipo` VARCHAR(191) NOT NULL DEFAULT 'GARANTIA',
  `titulo` VARCHAR(191) NOT NULL,
  `descricao` TEXT NULL,
  `processo` TEXT NULL,
  `custo` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `valor_venda` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `data_abertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `data_previsao` DATETIME(3) NULL,
  `data_conclusao` DATETIME(3) NULL,
  `observacoes` TEXT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `garantias_cliente_id_idx`(`cliente_id`),
  INDEX `garantias_venda_id_idx`(`venda_id`),
  INDEX `garantias_funcionario_responsavel_id_idx`(`funcionario_responsavel_id`),
  INDEX `garantias_status_idx`(`status`),
  INDEX `garantias_tipo_idx`(`tipo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_cliente := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'garantias_cliente_id_fkey'
      AND TABLE_NAME = 'garantias'
  ) = 0,
  'ALTER TABLE `garantias` ADD CONSTRAINT `garantias_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @fk_cliente;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_venda := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'garantias_venda_id_fkey'
      AND TABLE_NAME = 'garantias'
  ) = 0,
  'ALTER TABLE `garantias` ADD CONSTRAINT `garantias_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @fk_venda;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_funcionario := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'garantias_funcionario_responsavel_id_fkey'
      AND TABLE_NAME = 'garantias'
  ) = 0,
  'ALTER TABLE `garantias` ADD CONSTRAINT `garantias_funcionario_responsavel_id_fkey` FOREIGN KEY (`funcionario_responsavel_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @fk_funcionario;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
