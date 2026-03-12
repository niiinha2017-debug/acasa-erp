-- CreateTable
CREATE TABLE `orcamento_tecnico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_loja_id` INTEGER NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orcamento_tecnico_agenda_loja_id_idx`(`agenda_loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_tecnico_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orcamento_tecnico_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(500) NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `observacao` VARCHAR(2000) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orcamento_tecnico_itens_orcamento_tecnico_id_idx`(`orcamento_tecnico_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orcamento_tecnico` ADD CONSTRAINT `orcamento_tecnico_agenda_loja_id_fkey` FOREIGN KEY (`agenda_loja_id`) REFERENCES `agenda_loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_tecnico_itens` ADD CONSTRAINT `orcamento_tecnico_itens_orcamento_tecnico_id_fkey` FOREIGN KEY (`orcamento_tecnico_id`) REFERENCES `orcamento_tecnico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
