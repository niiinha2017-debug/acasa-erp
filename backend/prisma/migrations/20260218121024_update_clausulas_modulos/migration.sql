-- CreateTable
CREATE TABLE `clausulas_modelos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `modulo_key` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `texto` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `clausulas_modelos_tipo_ordem_idx`(`tipo`, `ordem`),
    UNIQUE INDEX `clausulas_modelos_tipo_modulo_key_key`(`tipo`, `modulo_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
