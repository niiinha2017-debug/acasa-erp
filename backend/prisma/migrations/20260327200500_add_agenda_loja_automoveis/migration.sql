CREATE TABLE `agenda_loja_automoveis` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `agenda_loja_id` INT NOT NULL,
  `automovel_id` INT NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `agenda_loja_automoveis_agenda_loja_id_automovel_id_key`(`agenda_loja_id`, `automovel_id`),
  INDEX `agenda_loja_automoveis_agenda_loja_id_idx`(`agenda_loja_id`),
  INDEX `agenda_loja_automoveis_automovel_id_idx`(`automovel_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `agenda_loja_automoveis`
  ADD CONSTRAINT `agenda_loja_automoveis_agenda_loja_id_fkey`
  FOREIGN KEY (`agenda_loja_id`) REFERENCES `agenda_loja`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `agenda_loja_automoveis`
  ADD CONSTRAINT `agenda_loja_automoveis_automovel_id_fkey`
  FOREIGN KEY (`automovel_id`) REFERENCES `automoveis`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
