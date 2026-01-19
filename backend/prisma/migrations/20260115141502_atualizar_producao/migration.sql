-- CreateTable
CREATE TABLE `producao_arquivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projeto_id` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `nome_original` VARCHAR(191) NOT NULL,
    `nome_arquivo` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NULL,
    `tamanho_bytes` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `producao_arquivos_projeto_id_idx`(`projeto_id`),
    INDEX `producao_arquivos_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `producao_arquivos` ADD CONSTRAINT `producao_arquivos_projeto_id_fkey` FOREIGN KEY (`projeto_id`) REFERENCES `producao_projetos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
