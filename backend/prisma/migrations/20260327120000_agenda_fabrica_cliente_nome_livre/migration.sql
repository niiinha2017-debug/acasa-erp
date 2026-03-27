-- Adiciona campo de nome livre de cliente na agenda_fabrica
-- Utilizado quando o agendamento não está vinculado a um cliente cadastrado no sistema.
ALTER TABLE `agenda_fabrica` ADD COLUMN `cliente_nome_livre` VARCHAR(191) NULL;
