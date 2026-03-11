-- CreateTable
CREATE TABLE `medicao_fina` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projeto_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(120) NOT NULL,
    `altura_cm` DECIMAL(10, 2) NULL,
    `largura_cm` DECIMAL(10, 2) NULL,
    `profundidade_cm` DECIMAL(10, 2) NULL,
    `prumo_ok` BOOLEAN NULL,
    `esquadro_ok` BOOLEAN NULL,
    `interferencias` JSON NULL,
    `observacoes_montador` TEXT NULL,
    `concluida` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `medicao_fina_projeto_id_idx`(`projeto_id`),
    UNIQUE INDEX `medicao_fina_projeto_id_nome_ambiente_key`(`projeto_id`, `nome_ambiente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `medicao_fina` ADD CONSTRAINT `medicao_fina_projeto_id_fkey` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
