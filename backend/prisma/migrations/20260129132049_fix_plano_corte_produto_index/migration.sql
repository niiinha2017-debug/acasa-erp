CREATE INDEX `plano_corte_produto_plano_corte_id_idx` ON `plano_corte_produto`(`plano_corte_id`);
CREATE INDEX `plano_corte_produto_item_id_idx` ON `plano_corte_produto`(`item_id`);

DROP INDEX `plano_corte_produto_plano_corte_id_item_id_key` ON `plano_corte_produto`;

