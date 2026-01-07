-- CreateTable
CREATE TABLE `plano_corte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fornecedor_id` INTEGER NOT NULL,
    `data_venda` DATETIME(3) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plano_corte_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fornecedor_id` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cor` VARCHAR(191) NULL,
    `medida` VARCHAR(191) NULL,
    `unidade` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `plano_corte_item_fornecedor_id_idx`(`fornecedor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plano_corte_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plano_corte_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plano_corte_consumo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plano_corte_id` INTEGER NOT NULL,
    `produto_id` INTEGER NOT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `plano_corte` ADD CONSTRAINT `plano_corte_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plano_corte_item` ADD CONSTRAINT `plano_corte_item_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plano_corte_produto` ADD CONSTRAINT `plano_corte_produto_plano_corte_id_fkey` FOREIGN KEY (`plano_corte_id`) REFERENCES `plano_corte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plano_corte_produto` ADD CONSTRAINT `plano_corte_produto_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `plano_corte_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plano_corte_consumo` ADD CONSTRAINT `plano_corte_consumo_plano_corte_id_fkey` FOREIGN KEY (`plano_corte_id`) REFERENCES `plano_corte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plano_corte_consumo` ADD CONSTRAINT `plano_corte_consumo_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
