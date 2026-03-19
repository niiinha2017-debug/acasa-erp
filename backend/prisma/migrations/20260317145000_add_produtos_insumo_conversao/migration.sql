ALTER TABLE `produtos`
  ADD COLUMN `insumo_fator_conversao` DECIMAL(10,3) NULL,
  ADD COLUMN `insumo_unidade_referencia` VARCHAR(191) NULL;
