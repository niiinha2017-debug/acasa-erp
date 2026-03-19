ALTER TABLE `produtos`
  ADD COLUMN `metragem_rolo_m` DECIMAL(10,3) NULL,
  ADD COLUMN `fita_vinculada_id` INT NULL,
  ADD INDEX `produtos_fita_vinculada_id_idx` (`fita_vinculada_id`);