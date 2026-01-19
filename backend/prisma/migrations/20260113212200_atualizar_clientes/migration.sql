/*
  Warnings:

  - Added the required column `status` to the `clientes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `nome_fantasia` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL;
