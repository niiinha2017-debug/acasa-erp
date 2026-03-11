-- AlterTable
ALTER TABLE `agenda_loja` ADD COLUMN `tempo_total_tarefa` DECIMAL(8, 2) NULL,
    ADD COLUMN `custo_tarefa_fabrica` DECIMAL(12, 2) NULL;

-- AlterTable
ALTER TABLE `agenda_fabrica` ADD COLUMN `tempo_total_tarefa` DECIMAL(8, 2) NULL,
    ADD COLUMN `custo_tarefa_fabrica` DECIMAL(12, 2) NULL;
