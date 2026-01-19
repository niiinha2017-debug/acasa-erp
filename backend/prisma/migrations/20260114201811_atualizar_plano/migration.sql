/*
  Warnings:

  - A unique constraint covering the columns `[plano_corte_id,produto_id]` on the table `plano_corte_consumo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plano_corte_id,item_id]` on the table `plano_corte_produto` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `plano_corte_consumo_plano_corte_id_produto_id_key` ON `plano_corte_consumo`(`plano_corte_id`, `produto_id`);

-- CreateIndex
CREATE UNIQUE INDEX `plano_corte_produto_plano_corte_id_item_id_key` ON `plano_corte_produto`(`plano_corte_id`, `item_id`);
