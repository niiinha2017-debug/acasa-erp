-- AlterTable recuperacao_senha: senha provisória expira em 24h
ALTER TABLE `recuperacao_senha` ADD COLUMN `expira_em` DATETIME(3) NULL;
CREATE INDEX `recuperacao_senha_expira_em_idx` ON `recuperacao_senha`(`expira_em`);

-- AlterTable clientes: vendedor responsável e profissão
ALTER TABLE `clientes` ADD COLUMN `vendedor_responsavel_id` INTEGER NULL;
ALTER TABLE `clientes` ADD COLUMN `profissao` VARCHAR(191) NULL;

CREATE INDEX `clientes_vendedor_responsavel_id_idx` ON `clientes`(`vendedor_responsavel_id`);

ALTER TABLE `clientes` ADD CONSTRAINT `clientes_vendedor_responsavel_id_fkey` FOREIGN KEY (`vendedor_responsavel_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
