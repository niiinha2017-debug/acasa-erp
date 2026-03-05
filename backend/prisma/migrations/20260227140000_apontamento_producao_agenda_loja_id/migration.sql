-- AlterTable: add agenda_loja_id to apontamento_producao (link to Agenda de Venda tasks)
ALTER TABLE `apontamento_producao` ADD COLUMN `agenda_loja_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `apontamento_producao_agenda_loja_id_idx` ON `apontamento_producao`(`agenda_loja_id`);

-- AddForeignKey
ALTER TABLE `apontamento_producao` ADD CONSTRAINT `apontamento_producao_agenda_loja_id_fkey` FOREIGN KEY (`agenda_loja_id`) REFERENCES `agenda_loja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
