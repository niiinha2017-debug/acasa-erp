-- CreateTable
CREATE TABLE `funcionarios_arquivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funcionario_id` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `arquivo_nome` VARCHAR(191) NOT NULL,
    `mime` VARCHAR(191) NULL,
    `tamanho` INTEGER NULL,
    `url` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `funcionarios_arquivos_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `funcionarios_arquivos` ADD CONSTRAINT `funcionarios_arquivos_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
