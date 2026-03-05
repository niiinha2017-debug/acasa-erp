-- AlterTable
ALTER TABLE `produtos` ADD COLUMN `estoque_minimo` INTEGER NULL DEFAULT 0;
ALTER TABLE `produtos` ADD COLUMN `categoria` VARCHAR(191) NULL;
