-- AlterTable
ALTER TABLE `funcionarios` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'ATIVO';

-- CreateTable
CREATE TABLE `ponto_justificativas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funcionario_id` INTEGER NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `tipo` VARCHAR(40) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `ponto_justificativas_funcionario_id_idx`(`funcionario_id`),
    INDEX `ponto_justificativas_data_idx`(`data`),
    INDEX `ponto_justificativas_tipo_idx`(`tipo`),
    UNIQUE INDEX `ponto_justificativas_funcionario_id_data_key`(`funcionario_id`, `data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ponto_justificativas_arquivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `justificativa_id` INTEGER NOT NULL,
    `arquivo_nome` VARCHAR(180) NOT NULL,
    `mime_type` VARCHAR(80) NULL,
    `tamanho` INTEGER NULL,
    `arquivo_path` VARCHAR(255) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ponto_justificativas_arquivos_justificativa_id_idx`(`justificativa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ponto_justificativas` ADD CONSTRAINT `ponto_justificativas_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ponto_justificativas_arquivos` ADD CONSTRAINT `ponto_justificativas_arquivos_justificativa_id_fkey` FOREIGN KEY (`justificativa_id`) REFERENCES `ponto_justificativas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
