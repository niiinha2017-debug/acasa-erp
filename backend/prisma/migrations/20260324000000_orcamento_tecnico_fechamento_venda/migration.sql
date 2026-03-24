-- AlterTable: adiciona campos de fechamento de venda no orçamento técnico
ALTER TABLE `orcamento_tecnico`
  ADD COLUMN `preco_venda`    DECIMAL(12,2) NULL,
  ADD COLUMN `desconto_pct`   DECIMAL(5,2)  NULL,
  ADD COLUMN `pagamentos_json` TEXT          NULL;
