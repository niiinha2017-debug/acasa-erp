-- AlterTable
ALTER TABLE `vendas` ADD COLUMN `valor_base_contrato` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `vendas_formas_pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `forma_pagamento_chave` VARCHAR(191) NOT NULL,
    `valor_base` DECIMAL(10, 2) NOT NULL,
    `quantidade_parcelas` INTEGER NOT NULL DEFAULT 1,
    `com_juros` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `vendas_formas_pagamento_venda_id_idx`(`venda_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendas_formas_pagamento` ADD CONSTRAINT `vendas_formas_pagamento_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
