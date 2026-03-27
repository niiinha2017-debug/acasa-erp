-- Campo para registrar quando o totem concluiu a execução física da tarefa.
-- A tarefa permanece aberta na agenda até o gestor encerrá-la manualmente.
ALTER TABLE `agenda_fabrica` ADD COLUMN `totem_concluido_em` DATETIME(3) NULL;
