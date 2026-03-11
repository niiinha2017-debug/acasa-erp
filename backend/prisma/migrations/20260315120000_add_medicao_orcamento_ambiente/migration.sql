-- CreateTable
CREATE TABLE `medicao_orcamento_ambiente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medicao_orcamento_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(191) NOT NULL,
    `largura_m` DECIMAL(10, 2) NULL,
    `pe_direito_m` DECIMAL(10, 2) NULL,
    `profundidade_m` DECIMAL(10, 2) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `medicao_orcamento_ambiente_medicao_orcamento_id_idx`(`medicao_orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `medicao_orcamento_ambiente` ADD CONSTRAINT `medicao_orcamento_ambiente_medicao_orcamento_id_fkey` FOREIGN KEY (`medicao_orcamento_id`) REFERENCES `medicao_orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
