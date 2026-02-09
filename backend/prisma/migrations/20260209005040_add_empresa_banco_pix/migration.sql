-- AlterTable
ALTER TABLE `empresa` ADD COLUMN `banco_agencia` VARCHAR(191) NULL,
    ADD COLUMN `banco_conta` VARCHAR(191) NULL,
    ADD COLUMN `banco_nome` VARCHAR(191) NULL,
    ADD COLUMN `banco_titular` VARCHAR(191) NULL,
    ADD COLUMN `pix` VARCHAR(191) NULL;
