ALTER TABLE `produtos`
  ADD COLUMN `custo_unitario_real` DECIMAL(10,4) NULL,
  ADD COLUMN `unidade_compra` VARCHAR(191) NULL,
  ADD COLUMN `unidade_consumo` VARCHAR(191) NULL,
  ADD COLUMN `fator_conversao` DOUBLE NULL;

UPDATE `produtos`
SET
  `unidade_compra` = COALESCE(`unidade_compra`, `unidade`),
  `unidade_consumo` = COALESCE(`unidade_consumo`, `insumo_unidade_referencia`),
  `fator_conversao` = CASE
    WHEN `fator_conversao` IS NOT NULL AND `fator_conversao` > 0 THEN `fator_conversao`
    WHEN `insumo_fator_conversao` IS NOT NULL AND `insumo_fator_conversao` > 0 THEN `insumo_fator_conversao`
    ELSE 1
  END,
  `custo_unitario_real` = CASE
    WHEN COALESCE(`fator_conversao`, `insumo_fator_conversao`, 1) <= 0 THEN `valor_unitario`
    ELSE (`valor_unitario` / COALESCE(NULLIF(`fator_conversao`, 0), NULLIF(`insumo_fator_conversao`, 0), 1))
  END;
