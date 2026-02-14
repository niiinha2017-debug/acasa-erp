-- CreateTable
CREATE TABLE `contratos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `venda_id` INTEGER NULL,
    `numero` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `data_inicio` DATETIME(3) NULL,
    `data_fim` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `contratos_cliente_id_idx`(`cliente_id`),
    INDEX `contratos_venda_id_idx`(`venda_id`),
    INDEX `contratos_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contratos` ADD CONSTRAINT `contratos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contratos` ADD CONSTRAINT `contratos_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
