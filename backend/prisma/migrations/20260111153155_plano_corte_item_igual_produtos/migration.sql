/*
  Warnings:

  - You are about to drop the column `nome` on the `plano_corte_item` table. All the data in the column will be lost.
  - Added the required column `nome_produto` to the `plano_corte_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantidade` to the `plano_corte_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_total` to the `plano_corte_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_unitario` to the `plano_corte_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `plano_corte_item` DROP COLUMN `nome`,
    ADD COLUMN `marca` VARCHAR(191) NULL,
    ADD COLUMN `nome_produto` VARCHAR(191) NOT NULL,
    ADD COLUMN `quantidade` INTEGER NOT NULL,
    ADD COLUMN `valor_total` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `valor_unitario` DECIMAL(10, 2) NOT NULL,
    MODIFY `unidade` VARCHAR(191) NULL;
