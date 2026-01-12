-- DropIndex
DROP INDEX `compras_tipo_compra_idx` ON `compras`;

-- AlterTable
ALTER TABLE `compras` ADD COLUMN `pago_em` DATETIME(3) NULL,
    ADD COLUMN `vencimento_em` DATETIME(3) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'EM_ABERTO';

-- CreateIndex
CREATE INDEX `compras_status_idx` ON `compras`(`status`);

-- CreateIndex
CREATE INDEX `compras_vencimento_em_idx` ON `compras`(`vencimento_em`);
