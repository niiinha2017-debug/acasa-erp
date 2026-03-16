CREATE TABLE `funcionario_custo_constante` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `funcionario_id` INTEGER NOT NULL,
  `salario_base` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `impostos_encargos_percentual` DECIMAL(5, 2) NOT NULL DEFAULT 0,
  `salario_adicional` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `beneficios` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `horas_mes_base` DECIMAL(8, 2) NOT NULL DEFAULT 176,
  `custo_total_mensal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `custo_hora` DECIMAL(12, 4) NOT NULL DEFAULT 0,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `funcionario_custo_constante_funcionario_id_key`(`funcionario_id`),
  INDEX `funcionario_custo_constante_funcionario_id_idx`(`funcionario_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `funcionario_custo_constante`
  ADD CONSTRAINT `funcionario_custo_constante_funcionario_id_fkey`
  FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
