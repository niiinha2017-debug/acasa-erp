-- AlterTable: separar taxas de cartão em processamento e antecipação
ALTER TABLE `ordem_servico`
  ADD COLUMN `valor_taxas_processamento_cartao` DECIMAL(12, 2) NULL,
  ADD COLUMN `valor_taxas_antecipacao_credito`  DECIMAL(12, 2) NULL;
