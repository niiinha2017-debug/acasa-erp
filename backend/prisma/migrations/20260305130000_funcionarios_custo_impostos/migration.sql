-- Funcionários: custo real (impostos/encargos % e custo total mensal)
ALTER TABLE `funcionarios` ADD COLUMN `impostos_encargos_percentual` DECIMAL(5, 2) NULL;
ALTER TABLE `funcionarios` ADD COLUMN `custo_total_mensal` DECIMAL(12, 2) NULL;
