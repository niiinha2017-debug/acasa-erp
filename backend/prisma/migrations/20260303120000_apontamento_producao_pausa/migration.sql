-- AlterTable: add pausa_inicio_em and pausa_fim_em to apontamento_producao (início / pausa / fim)
ALTER TABLE `apontamento_producao` ADD COLUMN `pausa_inicio_em` DATETIME(3) NULL;
ALTER TABLE `apontamento_producao` ADD COLUMN `pausa_fim_em` DATETIME(3) NULL;
