/*
  Warnings:

  - You are about to drop the column `status_financeiro` on the `compras` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `compras_status_financeiro_idx` ON `compras`;

-- AlterTable
ALTER TABLE `compras` DROP COLUMN `status_financeiro`,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'EM_ABERTO',
    MODIFY `vencimento_em` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `despesas` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'EM_ABERTO';

-- CreateIndex
CREATE INDEX `compras_status_idx` ON `compras`(`status`);
