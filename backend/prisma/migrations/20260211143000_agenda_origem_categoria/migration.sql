-- Add agenda categorization and flow origin
ALTER TABLE `agenda_global`
  ADD COLUMN `categoria` VARCHAR(40) NULL,
  ADD COLUMN `origem_fluxo` VARCHAR(30) NULL;

CREATE INDEX `agenda_global_categoria_idx` ON `agenda_global`(`categoria`);
CREATE INDEX `agenda_global_origem_fluxo_idx` ON `agenda_global`(`origem_fluxo`);
