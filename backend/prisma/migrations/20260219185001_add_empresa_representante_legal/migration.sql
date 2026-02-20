-- AlterTable
ALTER TABLE `empresa` ADD COLUMN `representante_estado_civil` VARCHAR(191) NULL,
    ADD COLUMN `representante_legal_cpf` VARCHAR(191) NULL,
    ADD COLUMN `representante_legal_nome` VARCHAR(191) NULL,
    ADD COLUMN `representante_legal_rg` VARCHAR(191) NULL;
