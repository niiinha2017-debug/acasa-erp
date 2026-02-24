-- Add agenda source and destination sector controls
ALTER TABLE `agenda_global`
  ADD COLUMN `categoria` VARCHAR(40) NULL,
  ADD COLUMN `origem_fluxo` VARCHAR(30) NULL,
  ADD COLUMN `setor_destino` VARCHAR(20) NULL DEFAULT 'LOJA';

CREATE INDEX `agenda_global_categoria_idx` ON `agenda_global`(`categoria`);
CREATE INDEX `agenda_global_origem_fluxo_idx` ON `agenda_global`(`origem_fluxo`);
CREATE INDEX `agenda_global_setor_destino_idx` ON `agenda_global`(`setor_destino`);
