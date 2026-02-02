/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `producao_projetos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[venda_item_id]` on the table `producao_projetos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plano_corte_id]` on the table `producao_projetos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `producao_projetos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `producao_projetos` ADD COLUMN `codigo` VARCHAR(60) NOT NULL,
    ADD COLUMN `plano_corte_id` INTEGER NULL,
    ADD COLUMN `venda_item_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `producao_tarefas` ADD COLUMN `funcao_aplicada` VARCHAR(80) NULL,
    ADD COLUMN `horas_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateIndex
CREATE UNIQUE INDEX `producao_projetos_codigo_key` ON `producao_projetos`(`codigo`);

-- CreateIndex
CREATE UNIQUE INDEX `producao_projetos_venda_item_id_key` ON `producao_projetos`(`venda_item_id`);

-- CreateIndex
CREATE UNIQUE INDEX `producao_projetos_plano_corte_id_key` ON `producao_projetos`(`plano_corte_id`);

-- CreateIndex
CREATE INDEX `producao_projetos_venda_item_id_idx` ON `producao_projetos`(`venda_item_id`);

-- CreateIndex
CREATE INDEX `producao_projetos_plano_corte_id_idx` ON `producao_projetos`(`plano_corte_id`);

-- AddForeignKey
ALTER TABLE `producao_projetos` ADD CONSTRAINT `producao_projetos_venda_item_id_fkey` FOREIGN KEY (`venda_item_id`) REFERENCES `vendas_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producao_projetos` ADD CONSTRAINT `producao_projetos_plano_corte_id_fkey` FOREIGN KEY (`plano_corte_id`) REFERENCES `plano_corte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
