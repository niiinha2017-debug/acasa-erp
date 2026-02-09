-- AlterTable
ALTER TABLE `plano_corte_produto` ADD COLUMN `comprimento_mm` INTEGER NULL,
    ADD COLUMN `espessura_mm` INTEGER NULL,
    ADD COLUMN `largura_mm` INTEGER NULL,
    ADD COLUMN `preco_m2` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `produtos` ADD COLUMN `comprimento_mm` INTEGER NULL,
    ADD COLUMN `espessura_mm` INTEGER NULL,
    ADD COLUMN `largura_mm` INTEGER NULL,
    ADD COLUMN `preco_m2` DECIMAL(10, 2) NULL;
