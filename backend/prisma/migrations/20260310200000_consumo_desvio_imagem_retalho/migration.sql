-- Agenda Fábrica: consumo estimado (área peças + perda padrão), consumo real e perda real (desvio) para DRE
ALTER TABLE `agenda_fabrica` ADD COLUMN `area_pecas_m2` DECIMAL(12, 4) NULL;
ALTER TABLE `agenda_fabrica` ADD COLUMN `consumo_estimado_m2` DECIMAL(12, 4) NULL;
ALTER TABLE `agenda_fabrica` ADD COLUMN `consumo_real_m2` DECIMAL(12, 4) NULL;
ALTER TABLE `agenda_fabrica` ADD COLUMN `perda_real_m2` DECIMAL(12, 4) NULL;

-- Retalho: imagem opcional (herda do produto quando null)
ALTER TABLE `estoque_retalho` ADD COLUMN `imagem_url` VARCHAR(500) NULL;
