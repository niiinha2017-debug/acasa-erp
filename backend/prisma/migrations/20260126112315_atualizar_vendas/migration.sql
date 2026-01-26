/*
  Warnings:

  - You are about to drop the column `data_entrega` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `observacao` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `observacao` on the `vendas_pagamentos` table. All the data in the column will be lost.
  - Added the required column `observacao` to the `vendas_itens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendas` DROP COLUMN `data_entrega`,
    DROP COLUMN `observacao`;

-- AlterTable
ALTER TABLE `vendas_itens` ADD COLUMN `observacao` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `vendas_pagamentos` DROP COLUMN `observacao`;
