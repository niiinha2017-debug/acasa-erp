-- AlterTable: permite múltiplas pausas no cronômetro (pausar → retomar → pausar de novo)
ALTER TABLE `apontamento_producao` ADD COLUMN `pausa_total_segundos` DOUBLE NULL;
