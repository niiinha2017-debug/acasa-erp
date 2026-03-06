-- AlterTable: orcamentos - vendedor responsável (espelho do cliente para todo o processo)
ALTER TABLE `orcamentos` ADD COLUMN `vendedor_responsavel_id` INTEGER NULL;
CREATE INDEX `orcamentos_vendedor_responsavel_id_idx` ON `orcamentos`(`vendedor_responsavel_id`);
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_vendedor_responsavel_id_fkey` FOREIGN KEY (`vendedor_responsavel_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: vendas - vendedor responsável (espelho do cliente para todo o processo)
ALTER TABLE `vendas` ADD COLUMN `vendedor_responsavel_id` INTEGER NULL;
CREATE INDEX `vendas_vendedor_responsavel_id_idx` ON `vendas`(`vendedor_responsavel_id`);
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_vendedor_responsavel_id_fkey` FOREIGN KEY (`vendedor_responsavel_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: contratos - vendedor responsável (espelho do cliente para todo o processo)
ALTER TABLE `contratos` ADD COLUMN `vendedor_responsavel_id` INTEGER NULL;
CREATE INDEX `contratos_vendedor_responsavel_id_idx` ON `contratos`(`vendedor_responsavel_id`);
ALTER TABLE `contratos` ADD CONSTRAINT `contratos_vendedor_responsavel_id_fkey` FOREIGN KEY (`vendedor_responsavel_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: preencher vendedor a partir do cliente nos registros já existentes
UPDATE `orcamentos` o
INNER JOIN `clientes` c ON c.id = o.cliente_id
SET o.vendedor_responsavel_id = c.vendedor_responsavel_id
WHERE o.vendedor_responsavel_id IS NULL;

UPDATE `vendas` v
INNER JOIN `clientes` c ON c.id = v.cliente_id
SET v.vendedor_responsavel_id = c.vendedor_responsavel_id
WHERE v.vendedor_responsavel_id IS NULL;

UPDATE `contratos` ct
INNER JOIN `clientes` c ON c.id = ct.cliente_id
SET ct.vendedor_responsavel_id = c.vendedor_responsavel_id
WHERE ct.vendedor_responsavel_id IS NULL;
