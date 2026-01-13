/*
  Warnings:

  - Added the required column `observacao` to the `orcamento_itens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orcamento_itens` ADD COLUMN `observacao` VARCHAR(191) NOT NULL;
