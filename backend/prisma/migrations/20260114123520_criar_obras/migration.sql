-- CreateTable
CREATE TABLE `obras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `status_processo` VARCHAR(191) NOT NULL,
    `data_medida` DATETIME(3) NULL,
    `data_orcamento` DATETIME(3) NULL,
    `data_medida_fina` DATETIME(3) NULL,
    `data_producao` DATETIME(3) NULL,
    `data_montagem` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `obras_cliente_id_idx`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `obras` ADD CONSTRAINT `obras_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
