/*
  Warnings:

  - You are about to drop the column `pago_em` on the `compras` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `compras` table. All the data in the column will be lost.
  - Made the column `vencimento_em` on table `compras` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `compras_status_idx` ON `compras`;

-- AlterTable
ALTER TABLE `compras` DROP COLUMN `pago_em`,
    DROP COLUMN `status`,
    ADD COLUMN `status_financeiro` VARCHAR(191) NOT NULL DEFAULT 'EM_ABERTO',
    MODIFY `vencimento_em` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `compras_tipo_compra_idx` ON `compras`(`tipo_compra`);

-- CreateIndex
CREATE INDEX `compras_status_financeiro_idx` ON `compras`(`status_financeiro`);
