/*
  Warnings:

  - Added the required column `unidade` to the `despesas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `despesas` ADD COLUMN `unidade` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `despesas_unidade_idx` ON `despesas`(`unidade`);
