-- CreateTable
CREATE TABLE `contratos_link_publico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `short_token` VARCHAR(191) NOT NULL,
    `contrato_id` INTEGER NOT NULL,
    `expira_em` DATETIME(3) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `contratos_link_publico_short_token_key`(`short_token`),
    INDEX `contratos_link_publico_short_token_idx`(`short_token`),
    INDEX `contratos_link_publico_expira_em_idx`(`expira_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contratos_link_publico` ADD CONSTRAINT `contratos_link_publico_contrato_id_fkey` FOREIGN KEY (`contrato_id`) REFERENCES `contratos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
