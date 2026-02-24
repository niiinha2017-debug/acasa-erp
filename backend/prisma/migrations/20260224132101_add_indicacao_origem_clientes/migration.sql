-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `indicacao_origem` VARCHAR(191) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO';
