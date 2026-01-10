-- AlterTable
ALTER TABLE `despesas` ADD COLUMN `parcela_numero` INTEGER NULL,
    ADD COLUMN `recorrencia_id` VARCHAR(36) NULL;

-- CreateIndex
CREATE INDEX `despesas_recorrencia_id_idx` ON `despesas`(`recorrencia_id`);
