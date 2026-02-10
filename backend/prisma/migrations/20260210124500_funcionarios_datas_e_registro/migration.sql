-- Add data_inicio and drop registro from funcionarios
ALTER TABLE `funcionarios`
  ADD COLUMN `data_inicio` DATETIME(3) NULL,
  DROP COLUMN `registro`;
