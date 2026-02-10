-- Add contato de referencia (nome/telefone) to funcionarios
ALTER TABLE `funcionarios`
  ADD COLUMN `contato_referencia_nome` VARCHAR(191) NULL,
  ADD COLUMN `contato_referencia_telefone` VARCHAR(191) NULL;
