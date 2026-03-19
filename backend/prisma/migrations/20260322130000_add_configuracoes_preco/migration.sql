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
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `configuracoes_preco_categoria_comercial_key`(`categoria_comercial`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;