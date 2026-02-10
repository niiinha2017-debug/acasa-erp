-- AlterTable
ALTER TABLE `agenda_global` MODIFY `cliente_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `agenda_global` ADD COLUMN `fornecedor_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `agenda_global_fornecedor_id_idx` ON `agenda_global`(`fornecedor_id`);

-- AddForeignKey
ALTER TABLE `agenda_global` ADD CONSTRAINT `agenda_global_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
