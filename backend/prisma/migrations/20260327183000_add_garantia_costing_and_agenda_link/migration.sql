ALTER TABLE `garantias`
  ADD COLUMN `horas_previstas` DECIMAL(8,2) NULL,
  ADD COLUMN `custo_produtos` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `custo_mao_obra_previsto` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `custo_fabrica_previsto` DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE `agenda_loja`
  ADD COLUMN `garantia_id` INTEGER NULL;

CREATE INDEX `agenda_loja_garantia_id_idx` ON `agenda_loja`(`garantia_id`);

ALTER TABLE `agenda_loja`
  ADD CONSTRAINT `agenda_loja_garantia_id_fkey`
  FOREIGN KEY (`garantia_id`) REFERENCES `garantias`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
