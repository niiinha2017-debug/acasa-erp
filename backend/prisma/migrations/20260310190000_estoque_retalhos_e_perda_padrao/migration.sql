-- CreateTable: estoque_retalho (sobras de material vinculadas ao produto original)
CREATE TABLE `estoque_retalho` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `produto_id` INTEGER NOT NULL,
    `agenda_fabrica_id` INTEGER NULL,
    `largura_mm` INTEGER NOT NULL,
    `comprimento_mm` INTEGER NOT NULL,
    `quantidade_m2` DECIMAL(10, 4) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `estoque_retalho_produto_id_idx`(`produto_id`),
    INDEX `estoque_retalho_agenda_fabrica_id_idx`(`agenda_fabrica_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `estoque_retalho` ADD CONSTRAINT `estoque_retalho_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (nullable: tarefa do totem que gerou a sobra)
ALTER TABLE `estoque_retalho` ADD CONSTRAINT `estoque_retalho_agenda_fabrica_id_fkey` FOREIGN KEY (`agenda_fabrica_id`) REFERENCES `agenda_fabrica`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Empresa: percentual de perda padrão para cálculo de desperdício
ALTER TABLE `empresa` ADD COLUMN `perda_padrao_percentual` DECIMAL(5, 2) NULL;
