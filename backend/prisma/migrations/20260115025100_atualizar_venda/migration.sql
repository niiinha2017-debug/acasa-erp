/*
  Warnings:

  - A unique constraint covering the columns `[orcamento_id]` on the table `vendas` will be added. If there are existing duplicate values, this will fail.
  - Made the column `orcamento_id` on table `vendas` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `vendas` DROP FOREIGN KEY `vendas_orcamento_id_fkey`;

-- AlterTable
ALTER TABLE `vendas` MODIFY `orcamento_id` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `vendas_orcamento_id_key` ON `vendas`(`orcamento_id`);

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
