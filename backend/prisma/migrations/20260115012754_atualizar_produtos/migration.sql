-- AlterTable
ALTER TABLE `produtos` MODIFY `quantidade` INTEGER NULL DEFAULT 0,
    MODIFY `valor_unitario` DECIMAL(10, 2) NULL,
    MODIFY `valor_total` DECIMAL(10, 2) NULL;
