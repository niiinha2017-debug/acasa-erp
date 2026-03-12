-- CreateTable: paredes por ambiente (Cozinha > Parede Pia, etc.)
CREATE TABLE `medicao_orcamento_parede` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medicao_orcamento_ambiente_id` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `largura_m` DECIMAL(10, 2) NULL,
    `pe_direito_m` DECIMAL(10, 2) NULL,
    `profundidade_m` DECIMAL(10, 2) NULL,
    `observacoes` TEXT NULL,
    `medidas_json` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `medicao_orcamento_parede_medicao_orcamento_ambiente_id_idx`(`medicao_orcamento_ambiente_id`),
    UNIQUE INDEX `moa_parede_ambiente_id_nome_unique`(`medicao_orcamento_ambiente_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `medicao_orcamento_parede` ADD CONSTRAINT `medicao_orcamento_parede_medicao_orcamento_ambiente_id_fkey` FOREIGN KEY (`medicao_orcamento_ambiente_id`) REFERENCES `medicao_orcamento_ambiente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
