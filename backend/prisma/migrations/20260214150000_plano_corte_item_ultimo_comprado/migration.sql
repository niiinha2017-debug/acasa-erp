-- AlterTable
ALTER TABLE `plano_corte_item` ADD COLUMN `ultimo_valor_comprado` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `ultimo_comprado_em` DATETIME(3) NULL;
