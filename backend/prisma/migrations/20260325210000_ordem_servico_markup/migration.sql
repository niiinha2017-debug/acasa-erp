-- AlterTable: campos de markup na ordem de serviço
ALTER TABLE `ordem_servico`
  ADD COLUMN `valor_bruto`          DECIMAL(12, 2) NULL,
  ADD COLUMN `valor_impostos_nf`    DECIMAL(12, 2) NULL,
  ADD COLUMN `valor_comissao`       DECIMAL(12, 2) NULL,
  ADD COLUMN `valor_taxas_cartao`   DECIMAL(12, 2) NULL,
  ADD COLUMN `valor_liquido`        DECIMAL(12, 2) NULL,
  ADD COLUMN `taxa_nota_percentual` DECIMAL(5, 2)  NULL,
  ADD COLUMN `tem_nota_fiscal`      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `comissionados`        JSON NULL;
