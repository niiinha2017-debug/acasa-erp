-- AlterTable fornecedor: ramo_atividade e prazo_entrega_dias
ALTER TABLE `fornecedor` ADD COLUMN `ramo_atividade` VARCHAR(191) NULL;
ALTER TABLE `fornecedor` ADD COLUMN `prazo_entrega_dias` INTEGER NULL;
