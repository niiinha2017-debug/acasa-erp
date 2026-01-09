-- AlterTable
ALTER TABLE `compras_itens` ADD COLUMN `produto_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `plano_corte_item` ADD COLUMN `ultimo_valor_vendido` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `ultimo_vendido_em` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `compras_itens_produto_id_idx` ON `compras_itens`(`produto_id`);

-- AddForeignKey
ALTER TABLE `compras_itens` ADD CONSTRAINT `compras_itens_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
