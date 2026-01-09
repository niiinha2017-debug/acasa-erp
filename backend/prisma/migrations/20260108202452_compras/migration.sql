-- CreateTable
CREATE TABLE `compras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(191) NOT NULL,
    `fornecedor_id` INTEGER NOT NULL,
    `venda_item_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `data_compra` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacao` VARCHAR(191) NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `compras_venda_id_idx`(`venda_id`),
    INDEX `compras_fornecedor_id_idx`(`fornecedor_id`),
    INDEX `compras_venda_id_nome_ambiente_idx`(`venda_id`, `nome_ambiente`),
    INDEX `compras_venda_item_id_idx`(`venda_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compras_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compra_id` INTEGER NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    `unidade` VARCHAR(191) NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valor_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `compras_itens_compra_id_idx`(`compra_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_venda_item_id_fkey` FOREIGN KEY (`venda_item_id`) REFERENCES `vendas_itens`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras_itens` ADD CONSTRAINT `compras_itens_compra_id_fkey` FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
