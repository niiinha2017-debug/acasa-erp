-- CreateTable
CREATE TABLE `despesas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo_movimento` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `classificacao` VARCHAR(191) NOT NULL,
    `local` VARCHAR(191) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `forma_pagamento` VARCHAR(191) NOT NULL,
    `quantidade_parcelas` INTEGER NOT NULL,
    `data_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_vencimento` DATETIME(3) NOT NULL,
    `data_pagamento` DATETIME(3) NULL,
    `funcionario_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,

    INDEX `despesas_tipo_movimento_idx`(`tipo_movimento`),
    INDEX `despesas_categoria_idx`(`categoria`),
    INDEX `despesas_classificacao_idx`(`classificacao`),
    INDEX `despesas_local_idx`(`local`),
    INDEX `despesas_status_idx`(`status`),
    INDEX `despesas_data_vencimento_idx`(`data_vencimento`),
    INDEX `despesas_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `despesas` ADD CONSTRAINT `despesas_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
