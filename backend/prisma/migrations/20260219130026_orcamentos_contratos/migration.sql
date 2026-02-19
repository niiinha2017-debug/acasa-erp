-- AlterTable
ALTER TABLE `orcamentos` ADD COLUMN `clausulas` JSON NULL;

-- CreateTable
CREATE TABLE `agenda_apontamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agenda_apontamentos_agenda_id_idx`(`agenda_id`),
    INDEX `agenda_apontamentos_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agenda_apontamentos` ADD CONSTRAINT `agenda_apontamentos_agenda_id_fkey` FOREIGN KEY (`agenda_id`) REFERENCES `agenda_global`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_apontamentos` ADD CONSTRAINT `agenda_apontamentos_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
