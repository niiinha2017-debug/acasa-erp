-- CreateTable
CREATE TABLE `medicao_orcamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_loja_id` INTEGER NOT NULL,
    `cliente_id` INTEGER NULL,
    `orcamento_id` INTEGER NULL,
    `medidas_gerais` TEXT NULL,
    `observacoes` TEXT NULL,
    `concluida` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `medicao_orcamento_agenda_loja_id_key`(`agenda_loja_id`),
    INDEX `medicao_orcamento_cliente_id_idx`(`cliente_id`),
    INDEX `medicao_orcamento_orcamento_id_idx`(`orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `medicao_orcamento` ADD CONSTRAINT `medicao_orcamento_agenda_loja_id_fkey` FOREIGN KEY (`agenda_loja_id`) REFERENCES `agenda_loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicao_orcamento` ADD CONSTRAINT `medicao_orcamento_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicao_orcamento` ADD CONSTRAINT `medicao_orcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
