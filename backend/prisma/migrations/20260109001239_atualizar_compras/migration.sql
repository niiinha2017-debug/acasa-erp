/*
  Warnings:

  - Added the required column `tipo_compra` to the `compras` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `compras` ADD COLUMN `tipo_compra` VARCHAR(191) NOT NULL,
    MODIFY `venda_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `compras_tipo_compra_idx` ON `compras`(`tipo_compra`);
