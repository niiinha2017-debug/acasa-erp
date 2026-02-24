-- CreateTable
CREATE TABLE `ponto_feriados_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATE NOT NULL,
    `nome` VARCHAR(191) NULL,
    `tipo` VARCHAR(60) NULL,
    `trabalha` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ponto_feriados_config_data_key`(`data`),
    INDEX `ponto_feriados_config_trabalha_data_idx`(`trabalha`, `data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
