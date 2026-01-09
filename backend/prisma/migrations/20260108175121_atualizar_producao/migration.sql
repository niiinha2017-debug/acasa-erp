-- AlterTable
ALTER TABLE `producao_projetos` ADD COLUMN `encaminhado_em` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `producao_projetos_encaminhado_em_idx` ON `producao_projetos`(`encaminhado_em`);
