-- Plano de corte 2D: persistência do resultado (JSON) para auditoria e canvas.
CREATE TABLE `corte_chapa_plano_2d` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `produto_id` INTEGER NOT NULL,
    `kerf_mm` DECIMAL(10, 2) NOT NULL DEFAULT 4.00,
    `trim_mm` DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    `scrap_min_largura_mm` INTEGER NOT NULL DEFAULT 200,
    `scrap_min_comprimento_mm` INTEGER NOT NULL DEFAULT 200,
    `payload_json` JSON NOT NULL,
    `aplicado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `corte_chapa_plano_2d_produto_id_idx` ON `corte_chapa_plano_2d`(`produto_id`);
CREATE INDEX `corte_chapa_plano_2d_criado_em_idx` ON `corte_chapa_plano_2d`(`criado_em`);

ALTER TABLE `corte_chapa_plano_2d` ADD CONSTRAINT `corte_chapa_plano_2d_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
