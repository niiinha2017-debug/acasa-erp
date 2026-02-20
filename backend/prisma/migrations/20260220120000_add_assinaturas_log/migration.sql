-- CreateTable
CREATE TABLE `assinaturas_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contrato_id` INTEGER NOT NULL,
    `data_hora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(191) NULL,
    `dispositivo` VARCHAR(191) NULL,
    `hash_documento` VARCHAR(191) NULL,
    `metodo_verificacao` VARCHAR(191) NULL,

    INDEX `assinaturas_log_contrato_id_idx`(`contrato_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assinaturas_log` ADD CONSTRAINT `assinaturas_log_contrato_id_fkey` FOREIGN KEY (`contrato_id`) REFERENCES `contratos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
