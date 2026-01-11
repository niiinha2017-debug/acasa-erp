/*
  Warnings:

  - Added the required column `nome_produto` to the `compras_itens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `compras_itens` ADD COLUMN `cor` VARCHAR(191) NULL,
    ADD COLUMN `marca` VARCHAR(191) NULL,
    ADD COLUMN `medida` VARCHAR(191) NULL,
    ADD COLUMN `nome_produto` VARCHAR(191) NOT NULL;
