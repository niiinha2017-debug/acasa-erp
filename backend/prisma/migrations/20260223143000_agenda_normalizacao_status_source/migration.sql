-- Persistência de auditoria mínima para estratégia POS_VENDA (venda|cliente)
ALTER TABLE `agenda_global`
  ADD COLUMN `status_source` VARCHAR(20) NULL,
  ADD COLUMN `status_aplicado_em` DATETIME(3) NULL;

CREATE INDEX `agenda_global_status_source_idx` ON `agenda_global`(`status_source`);

-- Normalização determinística de origem_fluxo para legados
UPDATE `agenda_global`
SET `origem_fluxo` = CASE
  WHEN `plano_corte_id` IS NOT NULL AND `venda_id` IS NOT NULL THEN 'VENDA_PLANO_CORTE'
  WHEN `plano_corte_id` IS NOT NULL THEN 'PLANO_CORTE'
  WHEN `venda_id` IS NOT NULL THEN 'LOJA_VENDA'
  ELSE 'TAREFA'
END
WHERE `origem_fluxo` IS NULL
   OR `origem_fluxo` NOT IN ('PLANO_CORTE', 'VENDA_PLANO_CORTE', 'LOJA_VENDA', 'POS_VENDA', 'TAREFA');

-- Normalização determinística de setor_destino para legados
UPDATE `agenda_global`
SET `setor_destino` = CASE
  WHEN `origem_fluxo` IN ('PLANO_CORTE', 'VENDA_PLANO_CORTE') THEN 'PRODUCAO'
  ELSE 'LOJA'
END
WHERE `setor_destino` IS NULL
   OR `setor_destino` NOT IN ('LOJA', 'PRODUCAO');
